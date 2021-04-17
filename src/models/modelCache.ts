import { autorun } from "mobx";
import * as monaco from "monaco-editor";
import { CellModel } from "./CellModel";

type CacheEntry = {
  refCount: number;
  dispose: () => void;
};
const cache = new Map<string, CacheEntry>();

export function releaseModel(cell: CellModel) {
  const uri = monaco.Uri.file(cell.path);
  let entry = cache.get(uri.toString());
  if (!entry || entry.refCount === 0) {
    throw new Error("releaseModel, but already released");
  }
  entry.refCount--;
  if (entry.refCount === 0) {
    let monacoModel = monaco.editor.getModel(uri);
    if (!monacoModel) {
      throw new Error("monaco model not found");
    }
    if (monacoModel?.isDisposed()) {
      throw new Error("monaco already already disposed");
    }
    entry.dispose();
    monacoModel.dispose();
    cache.delete(uri.toString());
  }
}

export function getModel(cell: CellModel): monaco.editor.ITextModel {
  const uri = monaco.Uri.file(cell.path);

  let entry = cache.get(uri.toString());

  let monacoModel = monaco.editor.getModel(uri);

  if (monacoModel?.isDisposed()) {
    throw new Error("got disposed monaco model");
  }

  if (entry) {
    if (!monacoModel) {
      throw new Error("monacoModel expected to be available");
    }
    entry.refCount++;
    return monacoModel;
  } else {
    if (monacoModel) {
      throw new Error("monaco model already exists");
    }
    const newCode = cell.code.toJSON();
    const newModel = monaco.editor.createModel(newCode, "typescript", uri);

    const dispose = autorun(() => {
      const newCode = cell.code.toString();
      if (newModel.getValue() !== newCode) {
        newModel.setValue(newCode);
      }
    });

    entry = {
      refCount: 1,
      dispose,
    };
    cache.set(uri.toString(), entry);
    return newModel;
  }
}
