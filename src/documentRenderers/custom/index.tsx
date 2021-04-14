import { observer } from "mobx-react-lite";
import TCDocument from "../../store/TCDocument";
import * as React from "react";
import { useState, useEffect } from "react";
import { autorun, toJS } from "mobx";
import { CellListModel } from "../../models/CellListModel";
import { CellModel } from "../../models/CellModel";
import * as monaco from "monaco-editor";
import { getEngineForDoc } from "../../typecellEngine/EngineWithOutput";

function getModel(cell: CellModel) {
  const newCode = cell.code.toJSON();
  const uri = monaco.Uri.file(cell.path);
  let model = monaco.editor.getModel(uri);
  if (!model) {
    model = monaco.editor.createModel(newCode, "typescript", uri);
  } else {
    if (model.getValue() === newCode) {
      console.warn("setting same code, this is a noop. Why do we set same code?")
      return model; // immediately return to prevent monaco model listeners to be fired in a loop
    }
    model.setValue(newCode);
  }
  return model;
}

// TODO: should this be a React component or raw JS?
export const CustomRenderer = observer((props: { rendererDocumentId: string }) => {
  if (props.rendererDocumentId.startsWith("!")) {
    throw new Error("don't expect built-in document as renderer here")
  }
  const [document, setDocument] = useState<TCDocument>();

  useEffect(() => {
    const doc = TCDocument.load(props.rendererDocumentId)
    setDocument(doc);
    return () => {
      doc.dispose();
    }
  }, [props.rendererDocumentId])


  useEffect(() => {
    if (!document) {
      return;
    }
    const disposer = autorun(() => {
      const cells = new CellListModel(document.data);
      const engine = getEngineForDoc(document);
      const models = cells.cells.forEach(c => {
        const model = getModel(c);
        engine.engine.registerModel(model);
        model.setValue(model.getValue()); // trick to force eval
      });

    });
    return disposer;
  }, [document]);

  if (!document) {
    return <div>Loading</div>;
  }
  const engine = getEngineForDoc(document);
  // console.log(document);

  if (document.type !== "!notebook") {
    // TODO: how do we handle not existing documents?
    return <div>Invalid document type {props.rendererDocumentId} {document.type}</div>
    // throw new Error("only notebook documents supported");
  }

  return <div><div>{(engine.engine.observableContext).context.layout?.value_}</div>
    <div>{JSON.stringify(document.refs.toJSON())}</div></div>;
});
