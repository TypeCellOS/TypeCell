import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef } from "react";
import { VscDiffAdded } from "react-icons/vsc";
import TCDocument from "../../store/TCDocument";
import EngineWithOutput from "../../typecellEngine/EngineWithOutput";
import CellListDraggableCell from "./CellListDraggableCell";
import NotebookCell from "./NotebookCell";

type Props = {
  document: TCDocument;
};

const NotebookRenderer: React.FC<Props> = observer((props) => {
  const disposer = useRef<() => void>();

  const engine = useMemo(() => {
    if (disposer.current) {
      disposer.current();
      disposer.current = undefined;
    }
    const newEngine = new EngineWithOutput(props.document.id);
    disposer.current = () => {
      newEngine.dispose();
    };
    return newEngine;
  }, [props.document.id]);

  useEffect(() => {
    return () => {
      if (disposer.current) {
        disposer.current();
        disposer.current = undefined;
      }
    };
  }, []);

  const onAdd = (i: number) => {
    props.document.cellList.addCell(i);
  };

  const remove = (i: number) => {
    props.document.cellList.removeCell(i);
  };

  const cells = props.document.cells;
  // renderLogger.log("cellList");
  return (
    <div className="cellList">
      {/* <p>{engine && engine.id} {Math.random()}</p> */}
      {cells.length === 0 && (
        <VscDiffAdded
          onClick={() => onAdd(0)}
          className="cellList-add-single"
        />
      )}
      {cells.map((e, i: number) => (
        <CellListDraggableCell
          key={i}
          onAddBefore={() => onAdd(i)}
          onAddAfter={() => onAdd(i + 1)}
          onRemove={() => remove(i)}
          index={i}
          moveCard={props.document.cellList.moveCell}>
          <NotebookCell
            cell={e}
            engine={engine}
            awareness={props.document.webrtcProvider.awareness}
          />
        </CellListDraggableCell>
      ))}
    </div>
  );
});

export default NotebookRenderer;
