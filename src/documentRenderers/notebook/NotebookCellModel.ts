import type * as Y from "yjs";
export type NotebookCellModel = {
  readonly language: string;
  /** @internal */
  readonly code: Y.Text;
  readonly path: string;
  readonly id: string;
};
