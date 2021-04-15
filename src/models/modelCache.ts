import * as monaco from "monaco-editor";
import { CellModel } from "./CellModel";

const refCount = new Map<string, number>();

export function releaseModel(cell: CellModel) {
  const uri = monaco.Uri.file(cell.path);
  let refs = refCount.get(uri.toString()) || 0;
  if (refs === 0) {
    throw new Error("releaseModel, but already released");
  }
  refCount.set(uri.toString(), refs--);
  if (refs === 0) {
    let model = monaco.editor.getModel(uri);
    if (!model) {
      throw new Error("model not found");
    }
    if (model?.isDisposed()) {
      throw new Error("already disposed");
    }
    // console.log("dispose", uri.toString());
    model.dispose();
    refCount.delete(uri.toString());
  }
}

export function getModel(cell: CellModel) {
  const uri = monaco.Uri.file(cell.path);

  const refs = refCount.get(uri.toString()) || 0;

  refCount.set(uri.toString(), refs + 1);

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
  } else {
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
