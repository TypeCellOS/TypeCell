import { MatrixAuthStore } from "../../matrix/MatrixAuthStore";
import { SessionStore } from "../../matrix/SessionStore";
import { NavigationStore } from "./navigationStore";

export const matrixAuthStore = new MatrixAuthStore();
export const sessionStore = new SessionStore(matrixAuthStore);
sessionStore.initialize().catch((e) => {
  console.error("error initializing sessionstore", e);
});

export const navigationStore = new NavigationStore();
