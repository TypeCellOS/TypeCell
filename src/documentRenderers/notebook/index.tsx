import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { VscDiffAdded } from "react-icons/vsc";

// import { renderLogger } from "../logger";
import { CellListModel } from "../../models/CellListModel";
import TCDocument from "../../store/TCDocument";
import EngineWithOutput from "../../typecellEngine/EngineWithOutput";
import CellListDraggableCell from "./CellListDraggableCell";
import NotebookCell from "./NotebookCell";

type Props = {
  document: TCDocument;
};
const NotebookRenderer: React.FC<Props> = observer((props) => {

  const [engine, setEngine] = useState<EngineWithOutput>();
  const [cellList, setCellList] = useState<CellListModel>();

  useEffect(() => {
    const newCellList = new CellListModel(props.document.id, props.document.data);
    const newEngine = new EngineWithOutput(props.document.id);
    setEngine(newEngine);
    setCellList(newCellList);
    return () => newEngine.dispose();
  }, [props.document.id, props.document.data]);

  if (!cellList) {
    return <div className="loading-CellList"></div>; // add className for debugging purposes
  }

  const onAdd = (i: number) => {
    cellList.addCell(i);
  }

  const remove = (i: number) => {
    cellList.removeCell(i);
  }

  const cells = cellList.cells;
  // renderLogger.log("cellList");
  return (
    <div className="cellList">
      {/* <p>{engine && engine.id} {Math.random()}</p> */}

      {cells.length === 0 && <VscDiffAdded onClick={() => onAdd(0)} className="cellList-add-single" />}
      {cells.map((e, i: number) => (
        <CellListDraggableCell
          key={i}
          onAddBefore={() => onAdd(i)}
          onAddAfter={() => onAdd(i + 1)}
          onRemove={() => remove(i)}
          index={i}
          moveCard={cellList.moveCell}
        >
          { engine && <NotebookCell cell={e} engine={engine} awareness={props.document.webrtcProvider.awareness} />}
        </CellListDraggableCell>
      ))}
    </div>
  );
});

export default NotebookRenderer;
