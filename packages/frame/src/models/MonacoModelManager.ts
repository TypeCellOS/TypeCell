import type * as monaco from "monaco-editor";
import { lifecycle } from "vscode-lib";

class ModelCollection extends lifecycle.ReferenceCollection<monaco.editor.IModel> {
  protected createReferencedObject(
    key: string,
    ...args: [string, string, monaco.Uri, typeof monaco]
  ): monaco.editor.IModel {
    return args[3].editor.createModel(args[0], args[1], args[2]);
  }

  protected destroyReferencedObject(
    key: string,
    object: monaco.editor.IModel
  ): void {
    object.dispose();
  }
}

const modelStore = new ModelCollection();

/**
 * This is a helper function to get monaco models. Because monaco models are registered in the global monaco.editor,
 * and multiple places in the code base might need access to the same monaco model, we need to make sure that we
 * track references of the monaco models so that they are not disposed prematurely.
 *
 * This way, references are tracked using the ReferenceCollection. Only if all references to a monaco model are
 * released, the monaco model will be disposed.
 */
export function getMonacoModel(
  code: string,
  language: string,
  path: monaco.Uri,
  monacoInstance: typeof monaco
) {
  return modelStore.acquire(
    path.toString(),
    code,
    language,
    path,
    monacoInstance
  );
}
