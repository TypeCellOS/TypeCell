import { autorun } from "mobx";
import * as monaco from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import { CellModel } from "../../models/CellModel";
import { MonacoBinding } from "y-monaco";
import { Engine } from "../../engine";

function getModel(cell: CellModel, engine: Engine, uri: monaco.Uri) {
  let newModel = monaco.editor.getModel(uri);

  if (!newModel) {
    newModel = monaco.editor.createModel(
      cell.code.toJSON(),
      cell.language === "node-typescript" ? "typescript" : cell.language, // TODO: fix in model?
      monaco.Uri.file(cell.path)
    );
    engine.registerModel(newModel);
  }
  return newModel;
}
const useCellModel = (cell: CellModel, engine: Engine) => {
  const [model, setModel] = useState<monaco.editor.ITextModel | null>();

  useEffect(() => {
    // if (model) {
    //   throw new Error("already has model");
    // }

    const disposes: Array<() => void> = [];

    const uri = monaco.Uri.file(cell.path);
    const newModel = getModel(cell, engine, uri);

    disposes.push(
      autorun(() => {
        monaco.editor.setModelLanguage(
          newModel,
          cell.language === "node-typescript" ? "typescript" : cell.language
        );
      })
    );
    setModel(newModel);
    return () => {
      disposes.forEach((d) => d());
      newModel.dispose();
      setModel(undefined);
    };
  }, [cell.path, engine]);

  return model;
};

export default useCellModel;
