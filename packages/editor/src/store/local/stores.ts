import { SupabaseSessionStore } from "../../app/supabase-auth/SupabaseSessionStore";
import { DEFAULT_PROVIDER } from "../../config/config";
import { SessionStore } from "./SessionStore";
import { NavigationStore } from "./navigationStore";

class StoreService {
  // public sessionStore: SessionStore = new MatrixSessionStore(
  //   new MatrixAuthStore()
  // );
  public sessionStore: SessionStore =
    DEFAULT_PROVIDER === "matrix"
      ? new SupabaseSessionStore() //new MatrixSessionStore(new MatrixAuthStore())
      : new SupabaseSessionStore();
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
