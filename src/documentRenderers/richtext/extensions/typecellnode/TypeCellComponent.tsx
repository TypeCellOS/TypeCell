import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import React, { useContext, useEffect, useState } from "react";
import { CellModel } from "../../../../models/CellModel";
import NotebookCell from "../../../notebook/NotebookCell";
import { EngineContext } from "./EngineContext";

export default function TypeCellComponent(props: any) {
  let [id, setId] = useState(props.node.attrs.id);

  // console.log("stateId", id, props.node.attrs.id);
  // if (!id) {
  //   id = Math.random() + "";
  //   setId(id);
  //   props.updateAttributes({ id });
  //   // debugger;
  // }

  useEffect(() => {
    if (!id) {
      id = Math.random() + "";
      setId(id);
      props.updateAttributes({ id });
    }
  }, [id, props.updateAttributes]);

  // return (
  //   <NodeViewWrapper as="div" className="react-component">
  //     {JSON.stringify(props.node)}
  //   </NodeViewWrapper>
  // );
  const ctx = useContext(EngineContext);

  // debugger;
  const cell = ctx.document!.cells.find((c) => c.id === id)!;

  if (!cell) {
    return <div>loading</div>;
  }

  return (
    <NodeViewWrapper as="div" className="react-component">
      <NotebookCell
        cell={cell}
        engine={ctx.engine!}
        awareness={ctx.document?.webrtcProvider.awareness!}
      />
    </NodeViewWrapper>
  );
}
