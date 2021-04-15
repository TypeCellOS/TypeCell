import { autorun } from "mobx";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { useEffect, useState } from "react";
import { CellListModel } from "../../models/CellListModel";
import { getModel } from "../../models/modelCache";
import TCDocument from "../../store/TCDocument";
import EngineWithOutput from "../../typecellEngine/EngineWithOutput";

// TODO: should this be a React component or raw JS?
export const CustomRenderer = observer((props: { rendererDocumentId: string }) => {
  if (props.rendererDocumentId.startsWith("!")) {
    throw new Error("don't expect built-in document as renderer here")
  }
  const [document, setDocument] = useState<TCDocument>();
  const [engine, setEngine] = useState<EngineWithOutput>();

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

    const newEngine = new EngineWithOutput(document.id);
    setEngine(newEngine);

    // TODO: refactor, and releaseModel()
    const autorunDisposer = autorun(() => {
      const cells = new CellListModel(document.id, document.data);
      const models = cells.cells.forEach(c => {
        const model = getModel(c);
        newEngine.engine.registerModel(model);
        // model.setValue(model.getValue()); // trick to force eval
      });

    });
    return () => {
      autorunDisposer();
      newEngine.dispose();
    }
  }, [document, document?.data]);

  if (!document || !engine) {
    return <div>Loading</div>;
  }
  // console.log(document);

  if (document.type !== "!notebook") {
    // TODO: how do we handle not existing documents?
    return <div>Invalid document type {props.rendererDocumentId} {document.type}</div>
    // throw new Error("only notebook documents supported");
  }


  // setInterval(() => { setRender(Math.random()) }, 2000);
  // console.log("render", render);
  return <div>{(engine.engine.observableContext).context.layout?.value_}</div>
  {/* <div>{JSON.stringify(toJS(engine.engine.observableContext))}</div></div> */ }
});
