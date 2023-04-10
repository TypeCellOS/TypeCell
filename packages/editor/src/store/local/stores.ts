import { MatrixAuthStore } from "../../app/matrix-auth/MatrixAuthStore";
import { MatrixSessionStore } from "../../app/matrix-auth/MatrixSessionStore";
import { SessionStore } from "./SessionStore";
import { NavigationStore } from "./navigationStore";

class StoreService {
  public sessionStore: SessionStore = new MatrixSessionStore(
    new MatrixAuthStore()
  );
  public navigationStore = new NavigationStore(this.sessionStore);
}

let storeService: StoreService | undefined;

export async function initializeStoreService() {
  storeService = new StoreService();
  await storeService.sessionStore.initialize();
}

export function getStoreService() {
  if (!storeService) {
    throw new Error("store service not initialized");
  }
  return storeService;
}

// autorun(() => {
//   YDocSyncManager.matrixClient =
//     typeof sessionStore.user === "string"
//       ? undefined
//       : sessionStore.user.matrixClient;
// });
