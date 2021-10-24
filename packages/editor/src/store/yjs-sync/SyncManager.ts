import { lifecycle } from "vscode-lib";
import { DocWebrtcProvider } from "@typecell-org/matrix-yjs";
import * as Y from "yjs";

export type SyncManager = lifecycle.IDisposable & {
  readonly doc: "loading" | "not-found" | Y.Doc;
  get canWrite(): boolean;

  initialize(): Promise<void>;

  /** @internal */
  webrtcProvider: DocWebrtcProvider | undefined;
};
