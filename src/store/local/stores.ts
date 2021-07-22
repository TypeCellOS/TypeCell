import { MatrixAuthStore } from "../../matrix-auth/MatrixAuthStore";
import { SessionStore } from "./SessionStore";

export const matrixAuthStore = new MatrixAuthStore();
export const sessionStore = new SessionStore(matrixAuthStore);
sessionStore.initialize().catch((e) => {
  console.error("error initializing sessionstore", e);
});

// autorun(() => {
//   YDocSyncManager.matrixClient =
//     typeof sessionStore.user === "string"
//       ? undefined
//       : sessionStore.user.matrixClient;
// });
