declare module "y-monaco" {
  import type * as monaco from "monaco-editor";
  import type * as Y from "yjs";
  declare class MonacoBinding {
    constructor(
      ytext: Y.Text,
      model: monaco.editor.ITextModel,
      editors?: Set<monaco.editor.IStandaloneCodeEditor>,
      awareness?: any
    );
    destroy();
  }
}
