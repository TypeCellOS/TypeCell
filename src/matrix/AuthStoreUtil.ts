import { IMatrixClientCreds } from "./auth/util/matrix";
import { IStoredSession } from "./MatrixAuthStore";
import createMatrixClient from "./createMatrixClient";
import * as StorageManager from "./StorageManager";
import { idbLoad, idbSave } from "./StorageManager";
import { encryptAES } from "./unexported/aes";
import { encodeUnpaddedBase64 } from "./unexported/olmlib";

const HOMESERVER_URL_KEY = "mx_hs_url";
const ID_SERVER_URL_KEY = "mx_is_url";

// Source: https://github.com/matrix-org/matrix-react-sdk/blob/d0d56d4b4293498c07605c17e773b9071e048b0c/src/Lifecycle.ts#L754
export function isSoftLogout(): boolean {
  return localStorage.getItem("mx_soft_logout") === "true";
}

// https://github.com/matrix-org/matrix-react-sdk/blob/d0d56d4b4293498c07605c17e773b9071e048b0c/src/Lifecycle.ts#L376
export async function abortLogin() {
  const signOut = true; //await showStorageEvictedDialog();
  if (signOut) {
    await clearStorage();
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
export async function clearStorage(opts?: {
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
 * Get a previously stored pickle key.  The pickle key is used for
 * encrypting libolm objects.
 * @param {string} userId the user ID for the user that the pickle key is for.
 * @param {string} userId the device ID that the pickle key is for.
 * @returns {string|null} the previously stored pickle key, or null if no
 *     pickle key has been stored.
 */
export async function getPickleKey(
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
export async function createPickleKey(
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
export async function pickleKeyToAesKey(
  pickleKey: string
): Promise<Uint8Array> {
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

export async function persistCredentials(
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
      const encrKey = await pickleKeyToAesKey(credentials.pickleKey);
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
 * Retrieves information about the stored session from the browser's storage. The session
 * may not be valid, as it is not tested for consistency here.
 * @returns {Object} Information about the session - see implementation for variables.
 */
export async function getStoredSessionVars(): Promise<IStoredSession> {
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
        await StorageManager.idbSave("account", "mx_access_token", accessToken);
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
export async function getStoredSessionOwner(): Promise<
  [string, boolean] | undefined
> {
  const { hsUrl, userId, hasAccessToken, isGuest } =
    await getStoredSessionVars();
  return hsUrl && userId && hasAccessToken ? [userId, isGuest] : undefined;
}
