import { NodeViewWrapper } from "@tiptap/react";
import { useContext } from "react";
import NotebookCell from "../../../notebook/NotebookCell";
import { EngineContext } from "./EngineContext";

export default function TypeCellComponent(props: any) {
  let id = props.node.attrs["block-id"];

  const ctx = useContext(EngineContext);

  const cell = ctx.document!.cells.find((c) => c.id === id)!;

  if (!cell) {
    return <div>Loading...</div>;
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
