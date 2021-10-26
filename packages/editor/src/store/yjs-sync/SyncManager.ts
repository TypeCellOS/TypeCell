import { lifecycle } from "vscode-lib";
import * as Y from "yjs";

export type SyncManager = lifecycle.IDisposable & {
  readonly doc: "loading" | "not-found" | Y.Doc;
  get canWrite(): boolean;

  initialize(): Promise<void>;

  awareness: any;
  on: () => void;
};
