import { MatrixAuthStore } from "../../matrix-auth/MatrixAuthStore";
import { SessionStore } from "./SessionStore";
import { NavigationStore } from "./navigationStore";
import { setupSearch } from "../../search";

export const matrixAuthStore = new MatrixAuthStore();
export const sessionStore = new SessionStore(matrixAuthStore);
sessionStore
  .initialize()
  .then(() => {
    setupSearch();
  })
  .catch((e) => {
    console.error("error initializing sessionstore", e);
  });

export const navigationStore = new NavigationStore();
