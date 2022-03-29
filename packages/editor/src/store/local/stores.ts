import { MatrixAuthStore } from "../../app/matrix-auth/MatrixAuthStore";
import { NavigationStore } from "./navigationStore";
import { SessionStore } from "./SessionStore";

class StoreService {
  public matrixAuthStore = new MatrixAuthStore();
  public sessionStore = new SessionStore(this.matrixAuthStore);
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
