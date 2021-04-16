import * as monaco from "monaco-editor";
import { MonacoBinding } from "../util/y-monaco";
import { CellModel } from "./CellModel";

const refCount = new Map<string, number>();
const editorBindings = new Map<string, MonacoBinding>();

export function releaseModel(cell: CellModel, editor?: monaco.editor.IEditor) {
  const uri = monaco.Uri.file(cell.path);
  const uriStr = uri.toString();
  let refs = refCount.get(uriStr) || 0;
  if (refs === 0) {
    throw new Error("releaseModel, but already released");
  }
  refCount.set(uri.toString(), refs--);
  if (editor) {
    editorBindings.get(uriStr)!.removeEditor(editor);
  }

  if (refs === 0) {
    let model = monaco.editor.getModel(uri);
    if (!model) {
      throw new Error("model not found");
    }
    if (model?.isDisposed()) {
      throw new Error("already disposed");
    }
    // console.log("dispose", uriStr);
    model.dispose();
    refCount.delete(uriStr);
    editorBindings.get(uriStr)!.destroy();
    editorBindings.delete(uriStr);
  }
}

export function getModel(
  cell: CellModel,
  editor?: monaco.editor.IStandaloneCodeEditor
) {
  const uri = monaco.Uri.file(cell.path);
  const uriStr = uri.toString();

  const refs = refCount.get(uriStr) || 0;

  refCount.set(uriStr, refs + 1);

  let model = monaco.editor.getModel(uri);

  if (!model && refs > 0) {
    throw new Error("model not expected");
  }

  if (model?.isDisposed()) {
    throw new Error("already disposed");
  }

  const newCode = cell.code.toJSON();
  if (!model) {
    model = monaco.editor.createModel(newCode, "typescript", uri);
    const monacoBinding = new MonacoBinding(
      cell.code,
      model,
      editor ? new Set([editor]) : new Set()
      // props.awareness // TODO: fix reference to doc
    );
    editorBindings.set(uriStr, monacoBinding);
  } else {
    if (editor) {
      editorBindings.get(uriStr)!.addEditor(editor);
    }
    if (model.getValue() === newCode) {
      console.warn(
        "setting same code, this is a noop. Why do we set same code?"
      );
      return model; // immediately return to prevent monaco model listeners to be fired in a loop
    }
    model.setValue(newCode);
  }
  return model;
}
