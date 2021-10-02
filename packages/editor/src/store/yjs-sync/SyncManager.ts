import { lifecycle } from "vscode-lib";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";

export type SyncManager = lifecycle.IDisposable & {
  readonly doc: "loading" | "not-found" | Y.Doc;
  get canWrite(): boolean;

  initialize(): Promise<void>;

  /** @internal */
  webrtcProvider: WebrtcProvider | undefined;
};
