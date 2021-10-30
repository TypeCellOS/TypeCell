import { MatrixClient } from "matrix-js-sdk";
import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";
import { MATRIX_CONFIG } from "../../config/config";
import { sendLoginRequest } from "./auth/LoginHelper";
import { IMatrixClientCreds } from "./auth/util/matrix";
import {
  abortLogin,
  clearStorage,
  createPickleKey,
  getPickleKey,
  getStoredSessionVars,
  isSoftLogout,
  persistCredentials,
  pickleKeyToAesKey,
  SSO_HOMESERVER_URL_KEY,
  SSO_ID_SERVER_URL_KEY,
} from "./AuthStoreUtil";
import { MatrixClientPeg } from "./MatrixClientPeg";
import * as StorageManager from "./StorageManager";
import { decryptAES } from "./unexported/aes";
import { decodeParams } from "./utils";

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

export class MatrixAuthStore {
  private accountPassword: string | undefined;
  private accountPasswordTimer: ReturnType<typeof setTimeout> | undefined;
  private firstSyncPromise: Promise<void> | undefined;
  private firstSyncComplete: boolean = false;
  private _isLoggingOut = false;
  public pendingInitialSyncAndKeySync = true;
  public _loggedIn = false;

  public needsCompleteSecurity = false;
  public needsE2ESetup = false;

  // TODO: test with logout and then login
  public get loggedInUser() {
    if (!this._loggedIn) {
      return undefined;
    }
    const currentUserId = MatrixClientPeg.get().getUserId() as string;

    const parts = currentUserId.split(":");
    if (parts.length !== 2) {
      throw new Error("invalid user id");
    }
    const [user /*_host*/] = parts; // TODO: think out host for federation
    if (!user.startsWith("@") || user.length < 2) {
      throw new Error("invalid user id");
    }

    return user;
  }

  constructor() {
    makeObservable(this, {
      _loggedIn: observable,
      postLoginSetup: action,
      loggedInUser: computed,
    });
  }

  public async initialize() {
    const params = decodeParams(window.location.search.substring(1));
    const loggedIn = await this.attemptTokenLogin(
      params as any,
      MATRIX_CONFIG.defaultDeviceDisplayName,
      "/"
    );

    const url = new URL(window.location.href);
    if (url.searchParams.has("loginToken")) {
      url.searchParams.delete("loginToken");
      window.history.replaceState(null, "", url.href);
    }

    if (loggedIn) {
      // this.tokenLogin = true;

      // Create and start the client
      await this.restoreFromLocalStorage({
        ignoreGuest: true,
      });
      await this.postLoginSetup();
      // TODO: handle and display errors
    } else {
      await this.loadSession();
    }
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

    const softLogout = isSoftLogout();

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
      await clearStorage();
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
      await abortLogin();
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
        await persistCredentials(credentials);
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
    this._loggedIn = true; // originally this would be above startMatrixClient
    return client;
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
        ? await createPickleKey(credentials.userId, credentials.deviceId)
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
      console.log("Session.logged_out");
      runInAction(() => {
        this._loggedIn = false;
      });
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
      //await MatrixClientPeg.start();
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

    if (isSoftLogout()) {
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
      // const defaultDeviceDisplayName = opts.defaultDeviceDisplayName;

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
        // We handle this manually in SessionStore
        // throw new Error("not implemented");
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

  /**
   * @param {Object} queryParams    string->string map of the
   *     query-parameters extracted from the real query-string of the starting
   *     URI.
   *
   * @param {string} defaultDeviceDisplayName
   * @param {string} fragmentAfterLogin path to go to after a successful login, only used for "Try again"
   *
   * @returns {Promise} promise which resolves to true if we completed the token
   *    login, else false
   */
  public async attemptTokenLogin(
    queryParams: Record<string, string>,
    defaultDeviceDisplayName?: string,
    fragmentAfterLogin?: string
  ): Promise<boolean> {
    if (!queryParams.loginToken) {
      return false;
    }

    const homeserver = localStorage.getItem(SSO_HOMESERVER_URL_KEY);
    const identityServer = localStorage.getItem(SSO_ID_SERVER_URL_KEY);
    if (!homeserver || !identityServer) {
      console.warn("Cannot log in with token: can't determine HS URL to use");
      throw new Error("unknown hs");
    }

    try {
      const creds = await sendLoginRequest(
        homeserver,
        identityServer,
        "m.login.token",
        {
          token: queryParams.loginToken,
          initial_device_display_name: defaultDeviceDisplayName,
        }
      );

      console.log("Logged in with token");
      await clearStorage();
      await persistCredentials(creds);
      // remember that we just logged in
      sessionStorage.setItem("mx_fresh_login", String(true));
      return true;
    } catch (err) {
      console.error("Failed to log in with login token:");
      console.error(err);
      // return false;
      throw err;
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
    } = await getStoredSessionVars();

    if (hasAccessToken && !accessToken) {
      abortLogin();
    }

    if (accessToken && userId && hsUrl) {
      if (ignoreGuest && isGuest) {
        console.log("Ignoring stored guest account: " + userId);
        return false;
      }

      let decryptedAccessToken = accessToken;
      const pickleKey = await getPickleKey(userId, deviceId);
      if (pickleKey) {
        console.log("Got pickle key");
        if (typeof accessToken !== "string") {
          const encrKey = await pickleKeyToAesKey(pickleKey);
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
      this._loggedIn = true;
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
      this._loggedIn = true;
    }
    this.pendingInitialSyncAndKeySync = false;
  };

  /**
   * Logs the current session out and transitions to the logged-out state
   */
  public logout = async () => {
    if (!MatrixClientPeg.get()) return;

    if (MatrixClientPeg.get().isGuest()) {
      // logout doesn't work for guest sessions
      // Also we sometimes want to re-log in a guest session if we abort the login.
      // defer until next tick because it calls a synchronous dispatch and we are likely here from a dispatch.
      setImmediate(() => this.onLoggedOut());
      return;
    }

    this._isLoggingOut = true;
    const client = MatrixClientPeg.get();

    // TODO
    // destroyPickleKey(
    //   client.getUserId(),
    //   client.getDeviceId()
    // );

    try {
      await client.logout();
    } catch (e) {
      // Just throwing an error here is going to be very unhelpful
      // if you're trying to log out because your server's down and
      // you want to log into a different server, so just forget the
      // access token. It's annoying that this will leave the access
      // token still valid, but we should fix this by having access
      // tokens expire (and if you really think you've been compromised,
      // change your password).
      console.log("Failed to call logout API: token will not be invalidated");
    } finally {
      this.onLoggedOut();
    }
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
    this._loggedIn = false;

    // DO NOT CALL LOGOUT. A soft logout preserves data, logout does not.
  }

  /*
   * Stops a running client and all related services, and clears persistent
   * storage. Used after a session has been logged out.
   */
  public async onLoggedOut(): Promise<void> {
    console.log("onLoggedOut");
    this._isLoggingOut = false;
    this._loggedIn = false;
    // Ensure that we dispatch a view change **before** stopping the client so
    // so that React components unmount first. This avoids React soft crashes
    // that can occur when components try to use a null client.
    // dis.dispatch({ action: "on_logged_out" }, true);
    this.stopMatrixClient();
    await clearStorage({ deleteEverything: true });
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
