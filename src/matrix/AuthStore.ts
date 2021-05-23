import { action, makeObservable, observable } from "mobx";
import { IMatrixClientCreds } from "./auth/util/matrix";
import { createClient, MatrixClient } from "matrix-js-sdk";
import * as StorageManager from "./StorageManager";
import createMatrixClient from "./createMatrixClient";
import { MatrixClientPeg } from "./MatrixClientPeg";
import { idbLoad, idbSave } from "./StorageManager";
import { encodeUnpaddedBase64 } from "./unexported/olmlib";
import { decryptAES, encryptAES } from "./unexported/aes";

const HOMESERVER_URL_KEY = "mx_hs_url";
const ID_SERVER_URL_KEY = "mx_is_url";

interface ILoadSessionOpts {
  enableGuest?: boolean;
  guestHsUrl?: string;
  guestIsUrl?: string;
  ignoreGuest?: boolean;
  defaultDeviceDisplayName?: string;
  fragmentQueryParams?: Record<string, string>;
}

export interface IStoredSession {
  hsUrl: string;
  isUrl: string;
  hasAccessToken: boolean;
  accessToken: string | object;
  userId: string;
  deviceId: string;
  isGuest: boolean;
}

class AuthStore {
  private accountPassword: string | undefined;
  private accountPasswordTimer: ReturnType<typeof setTimeout> | undefined;
  private firstSyncPromise: Promise<void> | undefined;
  private firstSyncComplete: boolean = false;
  private _isLoggingOut = false;
  public pendingInitialSyncAndKeySync = true;
  public loggedIn = false;
  public needsCompleteSecurity = false;
  public needsE2ESetup = false;

  constructor() {
    makeObservable(this, {
      loggedIn: observable,
      postLoginSetup: action,
    });
  }

  // Source: https://github.com/matrix-org/matrix-react-sdk/blob/d0d56d4b4293498c07605c17e773b9071e048b0c/src/Lifecycle.ts#L754
  private isSoftLogout(): boolean {
    return localStorage.getItem("mx_soft_logout") === "true";
  }

  /**
   * fires on_logging_in, optionally clears localstorage, persists new credentials
   * to localstorage, starts the new client.
   *
   * @param {MatrixClientCreds} credentials
   * @param {Boolean} clearStorage
   *
   * @returns {Promise} promise which resolves to the new MatrixClient once it has been started
   *
   * Source: https://github.com/matrix-org/matrix-react-sdk/blob/d0d56d4b4293498c07605c17e773b9071e048b0c/src/Lifecycle.ts#L541
   */
  private async doSetLoggedIn(
    credentials: IMatrixClientCreds,
    clearStorageEnabled: boolean
  ): Promise<MatrixClient> {
    credentials.guest = Boolean(credentials.guest);

    const softLogout = this.isSoftLogout();

    console.log(
      "setLoggedIn: mxid: " +
        credentials.userId +
        " deviceId: " +
        credentials.deviceId +
        " guest: " +
        credentials.guest +
        " hs: " +
        credentials.homeserverUrl +
        " softLogout: " +
        softLogout,
      " freshLogin: " + credentials.freshLogin
    );

    // This is dispatched to indicate that the user is still in the process of logging in
    // because async code may take some time to resolve, breaking the assumption that
    // `setLoggedIn` takes an "instant" to complete, and dispatch `on_logged_in` a few ms
    // later than MatrixChat might assume.
    //
    // we fire it *synchronously* to make sure it fires before on_logged_in.
    // (dis.dispatch uses `setTimeout`, which does not guarantee ordering.)

    // dis.dispatch({ action: "on_logging_in" }, true);

    if (clearStorageEnabled) {
      await this.clearStorage();
    }

    const results = await StorageManager.checkConsistency();
    // If there's an inconsistency between account data in local storage and the
    // crypto store, we'll be generally confused when handling encrypted data.
    // Show a modal recommending a full reset of storage.
    if (
      results.dataInLocalStorage &&
      results.cryptoInited &&
      !results.dataInCryptoStore
    ) {
      await this.abortLogin();
    }

    // Analytics.setLoggedIn(credentials.guest, credentials.homeserverUrl);

    MatrixClientPeg.replaceUsingCreds(credentials);
    const client = MatrixClientPeg.get();

    if (
      credentials.freshLogin &&
      false // SettingsStore.getValue("feature_dehydration")
    ) {
      // If we just logged in, try to rehydrate a device instead of using a
      // new device.  If it succeeds, we'll get a new device ID, so make sure
      // we persist that ID to localStorage
      const newDeviceId = await client.rehydrateDevice();
      if (newDeviceId) {
        credentials.deviceId = newDeviceId;
      }

      delete credentials.freshLogin;
    }

    if (localStorage) {
      try {
        await this.persistCredentials(credentials);
        // make sure we don't think that it's a fresh login any more
        sessionStorage.removeItem("mx_fresh_login");
      } catch (e) {
        console.warn("Error using local storage: can't persist session!", e);
      }
    } else {
      console.warn("No local storage available: can't persist session!");
    }

    StorageManager.tryPersistStorage();
    // dis.dispatch({ action: "on_logged_in" });

    await this.startMatrixClient(/*startSyncing=*/ !softLogout);
    this.loggedIn = true; // originally this would be above startMatrixClient
    return client;
  }

  // https://github.com/matrix-org/matrix-react-sdk/blob/d0d56d4b4293498c07605c17e773b9071e048b0c/src/Lifecycle.ts#L376
  private async abortLogin() {
    const signOut = true; //await showStorageEvictedDialog();
    if (signOut) {
      await this.clearStorage();
      // This error feels a bit clunky, but we want to make sure we don't go any
      // further and instead head back to sign in.
      throw new Error(
        "Aborting login in progress because of storage inconsistency"
      );
    }
  }

  /**
   * @param {object} opts Options for how to clear storage.
   * @returns {Promise} promise which resolves once the stores have been cleared
   *
   * Source: https://github.com/matrix-org/matrix-react-sdk/blob/d0d56d4b4293498c07605c17e773b9071e048b0c/src/Lifecycle.ts#L843
   */
  private async clearStorage(opts?: {
    deleteEverything?: boolean;
  }): Promise<void> {
    if (window.localStorage) {
      // try to save any 3pid invites from being obliterated
      // const pendingInvites = ThreepidInviteStore.instance.getWireInvites();

      window.localStorage.clear();

      try {
        await StorageManager.idbDelete("account", "mx_access_token");
      } catch (e) {}

      // now restore those invites
      if (!opts?.deleteEverything) {
        // pendingInvites.forEach((i) => {
        //   const roomId = i.roomId;
        //   delete i.roomId; // delete to avoid confusing the store
        //   ThreepidInviteStore.instance.storeInvite(roomId, i);
        // });
      }
    }

    if (window.sessionStorage) {
      window.sessionStorage.clear();
    }

    // create a temporary client to clear out the persistent stores.
    const cli = createMatrixClient({
      // we'll never make any requests, so can pass a bogus HS URL
      baseUrl: "",
    });

    // await EventIndexPeg.deleteEventIndex();
    await cli.clearStores();
  }

  /**
   * Transitions to a logged-in state using the given credentials.
   *
   * Starts the matrix client and all other react-sdk services that
   * listen for events while a session is logged in.
   *
   * Also stops the old MatrixClient and clears old credentials/etc out of
   * storage before starting the new client.
   *
   * @param {MatrixClientCreds} credentials The credentials to use
   *
   * @returns {Promise} promise which resolves to the new MatrixClient once it has been started
   *
   * Source: https://github.com/matrix-org/matrix-react-sdk/blob/develop/src/Lifecycle.ts
   */
  private async setLoggedIn(
    credentials: IMatrixClientCreds
  ): Promise<MatrixClient> {
    credentials.freshLogin = true;
    this.stopMatrixClient();
    const pickleKey =
      credentials.userId && credentials.deviceId
        ? await this.createPickleKey(credentials.userId, credentials.deviceId)
        : null;

    if (pickleKey) {
      console.log("Created pickle key");
    } else {
      console.log("Pickle key not created");
    }

    return this.doSetLoggedIn(
      Object.assign({}, credentials, { pickleKey }),
      true
    );
  }

  /**
   * Get a previously stored pickle key.  The pickle key is used for
   * encrypting libolm objects.
   * @param {string} userId the user ID for the user that the pickle key is for.
   * @param {string} userId the device ID that the pickle key is for.
   * @returns {string|null} the previously stored pickle key, or null if no
   *     pickle key has been stored.
   */
  async getPickleKey(
    userId: string,
    deviceId: string
  ): Promise<string | undefined> {
    if (!window.crypto || !window.crypto.subtle) {
      return undefined;
    }
    let data;
    try {
      data = await idbLoad("pickleKey", [userId, deviceId]);
    } catch (e) {}
    if (!data) {
      return undefined;
    }
    if (!data.encrypted || !data.iv || !data.cryptoKey) {
      console.error("Badly formatted pickle key");
      return undefined;
    }

    const additionalData = new Uint8Array(userId.length + deviceId.length + 1);
    for (let i = 0; i < userId.length; i++) {
      additionalData[i] = userId.charCodeAt(i);
    }
    additionalData[userId.length] = 124; // "|"
    for (let i = 0; i < deviceId.length; i++) {
      additionalData[userId.length + 1 + i] = deviceId.charCodeAt(i);
    }

    try {
      const key = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: data.iv, additionalData },
        data.cryptoKey,
        data.encrypted
      );
      return encodeUnpaddedBase64(key);
    } catch (e) {
      console.error("Error decrypting pickle key");
      return undefined;
    }
  }

  /**
   * Create and store a pickle key for encrypting libolm objects.
   * @param {string} userId the user ID for the user that the pickle key is for.
   * @param {string} userId the device ID that the pickle key is for.
   * @returns {string|null} the pickle key, or null if the platform does not
   *     support storing pickle keys.
   */
  private async createPickleKey(
    userId: string,
    deviceId: string
  ): Promise<string | null> {
    if (!window.crypto || !window.crypto.subtle) {
      return null;
    }
    const crypto = window.crypto;
    const randomArray = new Uint8Array(32);
    crypto.getRandomValues(randomArray);
    const cryptoKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    const iv = new Uint8Array(32);
    crypto.getRandomValues(iv);

    const additionalData = new Uint8Array(userId.length + deviceId.length + 1);
    for (let i = 0; i < userId.length; i++) {
      additionalData[i] = userId.charCodeAt(i);
    }
    additionalData[userId.length] = 124; // "|"
    for (let i = 0; i < deviceId.length; i++) {
      additionalData[userId.length + 1 + i] = deviceId.charCodeAt(i);
    }

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData },
      cryptoKey,
      randomArray
    );

    try {
      await idbSave("pickleKey", [userId, deviceId], {
        encrypted,
        iv,
        cryptoKey,
      });
    } catch (e) {
      return null;
    }
    return encodeUnpaddedBase64(randomArray);
  }

  // The pickle key is a string of unspecified length and format.  For AES, we
  // need a 256-bit Uint8Array.  So we HKDF the pickle key to generate the AES
  // key.  The AES key should be zeroed after it is used.
  private async pickleKeyToAesKey(pickleKey: string): Promise<Uint8Array> {
    const pickleKeyBuffer = new Uint8Array(pickleKey.length);
    for (let i = 0; i < pickleKey.length; i++) {
      pickleKeyBuffer[i] = pickleKey.charCodeAt(i);
    }
    const hkdfKey = await window.crypto.subtle.importKey(
      "raw",
      pickleKeyBuffer,
      "HKDF",
      false,
      ["deriveBits"]
    );
    pickleKeyBuffer.fill(0);
    return new Uint8Array(
      await window.crypto.subtle.deriveBits(
        {
          name: "HKDF",
          hash: "SHA-256",
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/879
          salt: new Uint8Array(32),
          info: new Uint8Array(0),
        },
        hkdfKey,
        256
      )
    );
  }

  private async persistCredentials(
    credentials: IMatrixClientCreds
  ): Promise<void> {
    localStorage.setItem(HOMESERVER_URL_KEY, credentials.homeserverUrl);
    if (credentials.identityServerUrl) {
      localStorage.setItem(ID_SERVER_URL_KEY, credentials.identityServerUrl);
    }
    localStorage.setItem("mx_user_id", credentials.userId);
    localStorage.setItem("mx_is_guest", JSON.stringify(credentials.guest));

    // store whether we expect to find an access token, to detect the case
    // where IndexedDB is blown away
    if (credentials.accessToken) {
      localStorage.setItem("mx_has_access_token", "true");
    } else {
      localStorage.deleteItem("mx_has_access_token");
    }

    if (credentials.pickleKey) {
      let encryptedAccessToken;
      try {
        // try to encrypt the access token using the pickle key
        const encrKey = await this.pickleKeyToAesKey(credentials.pickleKey);
        encryptedAccessToken = await encryptAES(
          credentials.accessToken,
          encrKey,
          "access_token"
        );
        encrKey.fill(0);
      } catch (e) {
        console.warn("Could not encrypt access token", e);
      }
      try {
        // save either the encrypted access token, or the plain access
        // token if we were unable to encrypt (e.g. if the browser doesn't
        // have WebCrypto).
        await StorageManager.idbSave(
          "account",
          "mx_access_token",
          encryptedAccessToken || credentials.accessToken
        );
      } catch (e) {
        // if we couldn't save to indexedDB, fall back to localStorage.  We
        // store the access token unencrypted since localStorage only saves
        // strings.
        localStorage.setItem("mx_access_token", credentials.accessToken);
      }
      localStorage.setItem("mx_has_pickle_key", String(true));
    } else {
      try {
        await StorageManager.idbSave(
          "account",
          "mx_access_token",
          credentials.accessToken
        );
      } catch (e) {
        localStorage.setItem("mx_access_token", credentials.accessToken);
      }
      if (localStorage.getItem("mx_has_pickle_key")) {
        console.error(
          "Expected a pickle key, but none provided.  Encryption may not work."
        );
      }
    }

    // if we didn't get a deviceId from the login, leave mx_device_id unset,
    // rather than setting it to "undefined".
    //
    // (in this case MatrixClient doesn't bother with the crypto stuff
    // - that's fine for us).
    if (credentials.deviceId) {
      localStorage.setItem("mx_device_id", credentials.deviceId);
    }

    // SecurityCustomisations.persistCredentials?.(credentials);

    console.log(`Session persisted for ${credentials.userId}`);
  }

  /**
   * After registration or login, we run various post-auth steps before entering the app
   * proper, such setting up cross-signing or verifying the new session.
   *
   * Note: SSO users (and any others using token login) currently do not pass through
   * this, as they instead jump straight into the app after `attemptTokenLogin`.
   *
   * Source: https://github.com/matrix-org/matrix-react-sdk/blob/develop/src/components/structures/MatrixChat.tsx#L1940
   */
  onUserCompletedLoginFlow = async (
    credentials: IMatrixClientCreds,
    password: string
  ) => {
    this.accountPassword = password;
    // self-destruct the password after 5mins
    if (this.accountPasswordTimer) {
      clearTimeout(this.accountPasswordTimer);
    }
    this.accountPasswordTimer = setTimeout(() => {
      this.accountPassword = undefined;
      this.accountPasswordTimer = undefined;
    }, 60 * 5 * 1000);

    // Create and start the client
    await this.setLoggedIn(credentials);
    await this.postLoginSetup();
    // PerformanceMonitor.instance.stop(PerformanceEntryNames.LOGIN);
    // PerformanceMonitor.instance.stop(PerformanceEntryNames.REGISTER);
  };

  /**
   * Called just before the matrix client is started
   * (useful for setting listeners)
   */
  private onWillStartClient() {
    // reset the 'have completed first sync' flag,
    // since we're about to start the client and therefore about
    // to do the first sync
    this.pendingInitialSyncAndKeySync = true;
    this.firstSyncComplete = false;
    let resolveFirstSyncPromise: () => void;
    this.firstSyncPromise = new Promise((r) => (resolveFirstSyncPromise = r));
    const cli = MatrixClientPeg.get();

    // Allow the JS SDK to reap timeline events. This reduces the amount of
    // memory consumed as the JS SDK stores multiple distinct copies of room
    // state (each of which can be 10s of MBs) for each DISJOINT timeline. This is
    // particularly noticeable when there are lots of 'limited' /sync responses
    // such as when laptops unsleep.
    // https://github.com/vector-im/element-web/issues/3307#issuecomment-282895568
    cli.setCanResetTimelineCallback((roomId: string) => {
      return true;
      // console.log(
      //   "Request to reset timeline in room ",
      //   roomId,
      //   " viewing:",
      //   this.state.currentRoomId
      // );
      // if (roomId !== this.state.currentRoomId) {
      //   // It is safe to remove events from rooms we are not viewing.
      //   return true;
      // }
      // // We are viewing the room which we want to reset. It is only safe to do
      // // this if we are not scrolled up in the view. To find out, delegate to
      // // the timeline panel. If the timeline panel doesn't exist, then we assume
      // // it is safe to reset the timeline.
      // if (!this.loggedInView.current) {
      //   return true;
      // }
      // return this.loggedInView.current.canResetTimelineInRoom(roomId);
    });

    cli.on("sync", (state: any, prevState: any, data: any) => {
      // LifecycleStore and others cannot directly subscribe to matrix client for
      // events because flux only allows store state changes during flux dispatches.
      // So dispatch directly from here. Ideally we'd use a SyncStateStore that
      // would do this dispatch and expose the sync state itself (by listening to
      // its own dispatch).
      // dis.dispatch({ action: "sync_state", prevState, state });

      // if (state === "ERROR" || state === "RECONNECTING") {
      //   if (data.error instanceof InvalidStoreError) {
      //     Lifecycle.handleInvalidStoreError(data.error);
      //   }
      //   this.setState({ syncError: data.error || true });
      // } else if (this.state.syncError) {
      //   this.setState({ syncError: null });
      // }

      // this.updateStatusIndicator(state, prevState);
      // if (state === "SYNCING" && prevState === "SYNCING") {
      //   return;
      // }
      // console.info("MatrixClient sync state => %s", state);
      // if (state !== "PREPARED") {
      //   return;
      // }

      // debugger;
      this.firstSyncComplete = true;
      resolveFirstSyncPromise();

      // if (
      //   Notifier.shouldShowPrompt() &&
      //   !MatrixClientPeg.userRegisteredWithinLastHours(24)
      // ) {
      //   showNotificationsToast(false);
      // }

      // dis.fire(Action.FocusComposer);
      // this.setState({
      //   ready: true,
      // });
    });

    cli.on("Session.logged_out", (errObj: any) => {
      if (this._isLoggingOut) return;

      // A modal might have been open when we were logged out by the server
      // Modal.closeCurrentModal("Session.logged_out");

      if (
        errObj.httpStatus === 401 &&
        errObj.data &&
        errObj.data["soft_logout"]
      ) {
        console.warn("Soft logout issued by server - avoiding data deletion");
        this.softLogout();
        return;
      }

      // Modal.createTrackedDialog("Signed out", "", ErrorDialog, {
      //   title: _t("Signed Out"),
      //   description: _t(
      //     "For security, this session has been signed out. Please sign in again."
      //   ),
      // });

      // dis.dispatch({
      // action: "logout",
      // });
    });
    // cli.on("no_consent", function (message, consentUri) {
    //   const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
    //   Modal.createTrackedDialog(
    //     "No Consent Dialog",
    //     "",
    //     QuestionDialog,
    //     {
    //       title: _t("Terms and Conditions"),
    //       description: (
    //         <div>
    //           <p>
    //             {" "}
    //             {_t(
    //               "To continue using the %(homeserverDomain)s homeserver " +
    //                 "you must review and agree to our terms and conditions.",
    //               { homeserverDomain: cli.getDomain() }
    //             )}
    //           </p>
    //         </div>
    //       ),
    //       button: _t("Review terms and conditions"),
    //       cancelButton: _t("Dismiss"),
    //       onFinished: (confirmed) => {
    //         if (confirmed) {
    //           const wnd = window.open(consentUri, "_blank");
    //           wnd.opener = null;
    //         }
    //       },
    //     },
    //     null,
    //     true
    //   );
    // });

    // const dft = new DecryptionFailureTracker(
    //   (total, errorCode) => {
    //     Analytics.trackEvent("E2E", "Decryption failure", errorCode, total);
    //     CountlyAnalytics.instance.track(
    //       "decryption_failure",
    //       { errorCode },
    //       null,
    //       { sum: total }
    //     );
    //   },
    //   (errorCode) => {
    //     // Map JS-SDK error codes to tracker codes for aggregation
    //     switch (errorCode) {
    //       case "MEGOLM_UNKNOWN_INBOUND_SESSION_ID":
    //         return "olm_keys_not_sent_error";
    //       case "OLM_UNKNOWN_MESSAGE_INDEX":
    //         return "olm_index_error";
    //       case undefined:
    //         return "unexpected_error";
    //       default:
    //         return "unspecified_error";
    //     }
    //   }
    // );

    // Shelved for later date when we have time to think about persisting history of
    // tracked events across sessions.
    // dft.loadTrackedEventHashMap();

    // dft.start();

    // When logging out, stop tracking failures and destroy state
    // cli.on("Session.logged_out", () => dft.stop());
    // cli.on("Event.decrypted", (e, err) => dft.eventDecrypted(e, err));

    // cli.on("Room", (room) => {
    //   if (MatrixClientPeg.get().isCryptoEnabled()) {
    //     const blacklistEnabled = SettingsStore.getValueAt(
    //       SettingLevel.ROOM_DEVICE,
    //       "blacklistUnverifiedDevices",
    //       room.roomId,
    //       /*explicit=*/ true
    //     );
    //     room.setBlacklistUnverifiedDevices(blacklistEnabled);
    //   }
    // });
    // cli.on("crypto.warning", (type) => {
    //   switch (type) {
    //     case "CRYPTO_WARNING_OLD_VERSION_DETECTED":
    //       Modal.createTrackedDialog("Crypto migrated", "", ErrorDialog, {
    //         title: _t("Old cryptography data detected"),
    //         description: _t(
    //           "Data from an older version of %(brand)s has been detected. " +
    //             "This will have caused end-to-end cryptography to malfunction " +
    //             "in the older version. End-to-end encrypted messages exchanged " +
    //             "recently whilst using the older version may not be decryptable " +
    //             "in this version. This may also cause messages exchanged with this " +
    //             "version to fail. If you experience problems, log out and back in " +
    //             "again. To retain message history, export and re-import your keys.",
    //           { brand: SdkConfig.get().brand }
    //         ),
    //       });
    //       break;
    //   }
    // });
    // cli.on("crypto.keyBackupFailed", async (errcode) => {
    //   let haveNewVersion;
    //   let newVersionInfo;
    //   // if key backup is still enabled, there must be a new backup in place
    //   if (MatrixClientPeg.get().getKeyBackupEnabled()) {
    //     haveNewVersion = true;
    //   } else {
    //     // otherwise check the server to see if there's a new one
    //     try {
    //       newVersionInfo = await MatrixClientPeg.get().getKeyBackupVersion();
    //       if (newVersionInfo !== null) haveNewVersion = true;
    //     } catch (e) {
    //       console.error(
    //         "Saw key backup error but failed to check backup version!",
    //         e
    //       );
    //       return;
    //     }
    //   }

    //   if (haveNewVersion) {
    //     Modal.createTrackedDialogAsync(
    //       "New Recovery Method",
    //       "New Recovery Method",
    //       import(
    //         "../../async-components/views/dialogs/security/NewRecoveryMethodDialog"
    //       ),
    //       { newVersionInfo }
    //     );
    //   } else {
    //     Modal.createTrackedDialogAsync(
    //       "Recovery Method Removed",
    //       "Recovery Method Removed",
    //       import(
    //         "../../async-components/views/dialogs/security/RecoveryMethodRemovedDialog"
    //       )
    //     );
    //   }
    // });

    // cli.on(
    //   "crypto.keySignatureUploadFailure",
    //   (failures, source, continuation) => {
    //     const KeySignatureUploadFailedDialog = sdk.getComponent(
    //       "views.dialogs.KeySignatureUploadFailedDialog"
    //     );
    //     Modal.createTrackedDialog(
    //       "Failed to upload key signatures",
    //       "Failed to upload key signatures",
    //       KeySignatureUploadFailedDialog,
    //       { failures, source, continuation }
    //     );
    //   }
    // );

    // cli.on("crypto.verification.request", (request) => {
    //   if (request.verifier) {
    //     const IncomingSasDialog = sdk.getComponent(
    //       "views.dialogs.IncomingSasDialog"
    //     );
    //     Modal.createTrackedDialog(
    //       "Incoming Verification",
    //       "",
    //       IncomingSasDialog,
    //       {
    //         verifier: request.verifier,
    //       },
    //       null,
    //       /* priority = */ false,
    //       /* static = */ true
    //     );
    //   } else if (request.pending) {
    //     ToastStore.sharedInstance().addOrReplaceToast({
    //       key: "verifreq_" + request.channel.transactionId,
    //       title: _t("Verification requested"),
    //       icon: "verification",
    //       props: { request },
    //       component: sdk.getComponent("toasts.VerificationRequestToast"),
    //       priority: 90,
    //     });
    //   }
    // });
  }

  /**
   * Starts the matrix client and all other react-sdk services that
   * listen for events while a session is logged in.
   * @param {boolean} startSyncing True (default) to actually start
   * syncing the client.
   *
   * Source: https://github.com/matrix-org/matrix-react-sdk/blob/d0d56d4b4293498c07605c17e773b9071e048b0c/src/Lifecycle.ts#L768
   */
  private async startMatrixClient(startSyncing = true): Promise<void> {
    console.log(`Lifecycle: Starting MatrixClient`);

    // dispatch this before starting the matrix client: it's used
    // to add listeners for the 'sync' event so otherwise we'd have
    // a race condition (and we need to dispatch synchronously for this
    // to work).
    // dis.dispatch({ action: "will_start_client" }, true);

    this.onWillStartClient();
    // reset things first just in case
    // TypingStore.sharedInstance().reset();
    // ToastStore.sharedInstance().reset();

    // Notifier.start();
    // UserActivity.sharedInstance().start();
    // DMRoomMap.makeShared().start();
    // IntegrationManagers.sharedInstance().startWatching();
    // ActiveWidgetStore.start();
    // CallHandler.sharedInstance().start();

    // Start Mjolnir even though we haven't checked the feature flag yet. Starting
    // the thing just wastes CPU cycles, but should result in no actual functionality
    // being exposed to the user.
    // Mjolnir.sharedInstance().start();

    if (startSyncing) {
      // The client might want to populate some views with events from the
      // index (e.g. the FilePanel), therefore initialize the event index
      // before the client.
      //   await EventIndexPeg.init();
      await MatrixClientPeg.start();
    } else {
      console.warn("Caller requested only auxiliary services be started");
      await MatrixClientPeg.assign();
    }

    // This needs to be started after crypto is set up
    // DeviceListener.sharedInstance().start(); TODO
    // Similarly, don't start sending presence updates until we've started
    // the client
    // if (!SettingsStore.getValue("lowBandwidth")) {
    //   Presence.start();
    // }

    // Now that we have a MatrixClientPeg, update the Jitsi info
    // await Jitsi.getInstance().start();

    // dispatch that we finished starting up to wire up any other bits
    // of the matrix client that cannot be set prior to starting up.
    //   dis.dispatch({action: 'client_started'});
    this.onClientStarted();

    if (this.isSoftLogout()) {
      this.softLogout();
    }
  }

  /**
   * Called at startup, to attempt to build a logged-in Matrix session. It tries
   * a number of things:
   *
   * 1. if we have a guest access token in the fragment query params, it uses
   *    that.
   * 2. if an access token is stored in local storage (from a previous session),
   *    it uses that.
   * 3. it attempts to auto-register as a guest user.
   *
   * If any of steps 1-4 are successful, it will call {_doSetLoggedIn}, which in
   * turn will raise on_logged_in and will_start_client events.
   *
   * @param {object} [opts]
   * @param {object} [opts.fragmentQueryParams]: string->string map of the
   *     query-parameters extracted from the #-fragment of the starting URI.
   * @param {boolean} [opts.enableGuest]: set to true to enable guest access
   *     tokens and auto-guest registrations.
   * @param {string} [opts.guestHsUrl]: homeserver URL. Only used if enableGuest
   *     is true; defines the HS to register against.
   * @param {string} [opts.guestIsUrl]: homeserver URL. Only used if enableGuest
   *     is true; defines the IS to use.
   * @param {bool} [opts.ignoreGuest]: If the stored session is a guest account,
   *     ignore it and don't load it.
   * @param {string} [opts.defaultDeviceDisplayName]: Default display name to use
   *     when registering as a guest.
   * @returns {Promise} a promise which resolves when the above process completes.
   *     Resolves to `true` if we ended up starting a session, or `false` if we
   *     failed.
   */
  public async loadSession(opts: ILoadSessionOpts = {}): Promise<boolean> {
    try {
      let enableGuest = opts.enableGuest || false;
      const guestHsUrl = opts.guestHsUrl;
      const guestIsUrl = opts.guestIsUrl;
      const fragmentQueryParams = opts.fragmentQueryParams || {};
      const defaultDeviceDisplayName = opts.defaultDeviceDisplayName;

      if (enableGuest && !guestHsUrl) {
        console.warn(
          "Cannot enable guest access: can't determine HS URL to use"
        );
        enableGuest = false;
      }

      if (
        enableGuest &&
        fragmentQueryParams.guest_user_id &&
        fragmentQueryParams.guest_access_token
      ) {
        console.log("Using guest access credentials");
        return this.doSetLoggedIn(
          {
            userId: fragmentQueryParams.guest_user_id,
            accessToken: fragmentQueryParams.guest_access_token,
            homeserverUrl: guestHsUrl!,
            identityServerUrl: guestIsUrl!,
            guest: true,
          },
          true
        ).then(() => true);
      }
      const success = await this.restoreFromLocalStorage({
        ignoreGuest: Boolean(opts.ignoreGuest),
      });
      if (success) {
        return true;
      }

      if (enableGuest) {
        throw new Error("not implemented");
        // if (!guestHsUrl || !guestIsUrl || !defaultDeviceDisplayName) {
        //   throw new Error("enable guest with invalid params");
        // }
        // return this.registerAsGuest(
        //   guestHsUrl,
        //   guestIsUrl,
        //   defaultDeviceDisplayName
        // );
      }

      // fall back to welcome screen
      return false;
    } catch (e) {
      throw e;
      // if (e instanceof AbortLoginAndRebuildStorage) {
      //   // If we're aborting login because of a storage inconsistency, we don't
      //   // need to show the general failure dialog. Instead, just go back to welcome.
      //   return false;
      // }
      // return handleLoadSessionFailure(e);
    }
  }

  // returns a promise which resolves to true if a session is found in
  // localstorage
  //
  // N.B. Lifecycle.js should not maintain any further localStorage state, we
  //      are moving towards using SessionStore to keep track of state related
  //      to the current session (which is typically backed by localStorage).
  //
  //      The plan is to gradually move the localStorage access done here into
  //      SessionStore to avoid bugs where the view becomes out-of-sync with
  //      localStorage (e.g. isGuest etc.)
  private async restoreFromLocalStorage(opts?: {
    ignoreGuest?: boolean;
  }): Promise<boolean> {
    const ignoreGuest = opts?.ignoreGuest;

    if (!localStorage) {
      return false;
    }

    const {
      hsUrl,
      isUrl,
      hasAccessToken,
      accessToken,
      userId,
      deviceId,
      isGuest,
    } = await this.getStoredSessionVars();

    if (hasAccessToken && !accessToken) {
      this.abortLogin();
    }

    if (accessToken && userId && hsUrl) {
      if (ignoreGuest && isGuest) {
        console.log("Ignoring stored guest account: " + userId);
        return false;
      }

      let decryptedAccessToken = accessToken;
      const pickleKey = await this.getPickleKey(userId, deviceId);
      if (pickleKey) {
        console.log("Got pickle key");
        if (typeof accessToken !== "string") {
          const encrKey = await this.pickleKeyToAesKey(pickleKey);
          decryptedAccessToken = await decryptAES(
            accessToken,
            encrKey,
            "access_token"
          );
          encrKey.fill(0);
        }
      } else {
        console.log("No pickle key available");
      }

      const freshLogin = sessionStorage.getItem("mx_fresh_login") === "true";
      sessionStorage.removeItem("mx_fresh_login");

      console.log(`Restoring session for ${userId}`);
      await this.doSetLoggedIn(
        {
          userId: userId,
          deviceId: deviceId,
          accessToken: decryptedAccessToken as string,
          homeserverUrl: hsUrl,
          identityServerUrl: isUrl,
          guest: isGuest,
          pickleKey: pickleKey,
          freshLogin: freshLogin,
        },
        false
      );
      return true;
    } else {
      console.log("No previous session found.");
      return false;
    }
  }

  /**
   * Retrieves information about the stored session from the browser's storage. The session
   * may not be valid, as it is not tested for consistency here.
   * @returns {Object} Information about the session - see implementation for variables.
   */
  private async getStoredSessionVars(): Promise<IStoredSession> {
    const hsUrl = localStorage.getItem(HOMESERVER_URL_KEY);
    const isUrl = localStorage.getItem(ID_SERVER_URL_KEY);
    let accessToken;
    try {
      accessToken = await StorageManager.idbLoad("account", "mx_access_token");
    } catch (e) {}
    if (!accessToken) {
      accessToken = localStorage.getItem("mx_access_token");
      if (accessToken) {
        try {
          // try to migrate access token to IndexedDB if we can
          await StorageManager.idbSave(
            "account",
            "mx_access_token",
            accessToken
          );
          localStorage.removeItem("mx_access_token");
        } catch (e) {}
      }
    }
    // if we pre-date storing "mx_has_access_token", but we retrieved an access
    // token, then we should say we have an access token
    const hasAccessToken =
      localStorage.getItem("mx_has_access_token") === "true" || !!accessToken;
    const userId = localStorage.getItem("mx_user_id");
    const deviceId = localStorage.getItem("mx_device_id");

    let isGuest;
    if (localStorage.getItem("mx_is_guest") !== null) {
      isGuest = localStorage.getItem("mx_is_guest") === "true";
    } else {
      // legacy key name
      isGuest = localStorage.getItem("matrix-is-guest") === "true";
    }

    return {
      hsUrl: hsUrl!, // TODO: fix !
      isUrl: isUrl!, // TODO: fix !
      hasAccessToken,
      accessToken,
      userId: userId!, // TODO: fix !
      deviceId: deviceId!, // TODO: fix !
      isGuest,
    };
  }

  /**
   * Gets the user ID of the persisted session, if one exists. This does not validate
   * that the user's credentials still work, just that they exist and that a user ID
   * is associated with them. The session is not loaded.
   * @returns {[String, bool]} The persisted session's owner and whether the stored
   *     session is for a guest user, if an owner exists. If there is no stored session,
   *     return undefined.
   */
  private async getStoredSessionOwner(): Promise<
    [string, boolean] | undefined
  > {
    const { hsUrl, userId, hasAccessToken, isGuest } =
      await this.getStoredSessionVars();
    return hsUrl && userId && hasAccessToken ? [userId, isGuest] : undefined;
  }

  /**
   * Called shortly after the matrix client has started. Useful for
   * setting up anything that requires the client to be started.
   * @private
   */
  private async onClientStarted() {
    const cli = MatrixClientPeg.get();

    if (cli.isCryptoEnabled()) {
      // const blacklistEnabled = SettingsStore.getValueAt(
      //   SettingLevel.DEVICE,
      //   "blacklistUnverifiedDevices"
      // );
      // cli.setGlobalBlacklistUnverifiedDevices(blacklistEnabled);
      // With cross-signing enabled, we send to unknown devices
      // without prompting. Any bad-device status the user should
      // be aware of will be signalled through the room shield
      // changing colour. More advanced behaviour will come once
      // we implement more settings.
      // cli.setGlobalErrorOnUnknownDevices(false);
    }
  }

  // source: https://github.com/matrix-org/matrix-react-sdk/blob/develop/src/components/structures/MatrixChat.tsx
  public postLoginSetup = async () => {
    const cli = MatrixClientPeg.get();
    const cryptoEnabled = cli.isCryptoEnabled();
    if (!cryptoEnabled) {
      // this.onLoggedIn();
      StorageManager.tryPersistStorage();
      this.loggedIn = true;
    }

    const promisesList = [this.firstSyncPromise!];
    if (cryptoEnabled) {
      // wait for the client to finish downloading cross-signing keys for us so we
      // know whether or not we have keys set up on this account
      promisesList.push(cli.downloadKeys([cli.getUserId()]));
    }

    // Now update the state to say we're waiting for the first sync to complete rather
    // than for the login to finish.
    this.pendingInitialSyncAndKeySync = true;

    await Promise.all(promisesList);

    if (!cryptoEnabled) {
      this.pendingInitialSyncAndKeySync = false;
      return;
    }

    const crossSigningIsSetUp = cli.getStoredCrossSigningForUser(
      cli.getUserId()
    );
    if (crossSigningIsSetUp) {
      // if (SecurityCustomisations.SHOW_ENCRYPTION_SETUP_UI === false) {
      // this.onLoggedIn();
      // } else {
      this.needsCompleteSecurity = true;
      // this.setStateForNewView({ view: Views.COMPLETE_SECURITY });
      // }
    } else if (
      await cli.doesServerSupportUnstableFeature("org.matrix.e2e_cross_signing")
    ) {
      this.needsE2ESetup = true;
      // this.setStateForNewView({ view: Views.E2E_SETUP });
    } else {
      // this.onLoggedIn();
      StorageManager.tryPersistStorage();
      this.loggedIn = true;
    }
    this.pendingInitialSyncAndKeySync = false;
  };

  // Source: https://github.com/matrix-org/matrix-react-sdk/blob/develop/src/Lifecycle.ts#L768
  private softLogout(): void {
    if (!MatrixClientPeg.get()) {
      return;
    }

    // Track that we've detected and trapped a soft logout. This helps prevent other
    // parts of the app from starting if there's no point (ie: don't sync if we've
    // been soft logged out, despite having credentials and data for a MatrixClient).
    localStorage.setItem("mx_soft_logout", "true");

    // Dev note: please keep this log line around. It can be useful for track down
    // random clients stopping in the middle of the logs.
    console.log("Soft logout initiated");
    this._isLoggingOut = true; // to avoid repeated flags
    // Ensure that we dispatch a view change **before** stopping the client so
    // so that React components unmount first. This avoids React soft crashes
    // that can occur when components try to use a null client.
    // dis.dispatch({ action: "on_client_not_viable" }); // generic version of on_logged_out
    // this.onSoftLogout();
    this.stopMatrixClient(/*unsetClient=*/ false);

    // DO NOT CALL LOGOUT. A soft logout preserves data, logout does not.
  }

  /**
   * Stop all the background processes related to the current client.
   * @param {boolean} unsetClient True (default) to abandon the client
   * on MatrixClientPeg after stopping.
   *
   * Source: https://github.com/matrix-org/matrix-react-sdk/blob/d0d56d4b4293498c07605c17e773b9071e048b0c/src/Lifecycle.ts#L885
   */
  private stopMatrixClient(unsetClient = true): void {
    // Notifier.stop();
    // CallHandler.sharedInstance().stop();
    // UserActivity.sharedInstance().stop();
    // TypingStore.sharedInstance().reset();
    // Presence.stop();
    // ActiveWidgetStore.stop();
    // IntegrationManagers.sharedInstance().stopWatching();
    // Mjolnir.sharedInstance().stop();
    // DeviceListener.sharedInstance().stop();
    // if (DMRoomMap.shared()) DMRoomMap.shared().stop();
    // EventIndexPeg.stop();
    this.pendingInitialSyncAndKeySync = true;
    this.firstSyncComplete = false;
    this.firstSyncPromise = undefined;
    const cli = MatrixClientPeg.get();
    if (cli) {
      cli.stopClient();
      cli.removeAllListeners();

      if (unsetClient) {
        MatrixClientPeg.unset();
        // EventIndexPeg.unset();
      }
    }
  }
}

export const authStore = new AuthStore();
