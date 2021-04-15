import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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
const CellList: React.FC<Props> = observer((props) => {

  // TODO: use correct pattern

  // const [cellList] = useState(() => new CellListModel(props.document.data.getXmlFragment("cells")));
  // const local = useLocalObservable(() => ({
  //   get cellList() {
  //     return new CellListModel(props.document.data.getXmlFragment("cells"))
  //   }
  // }));
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
    return <div>Loading</div>;
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
      <DndProvider backend={HTML5Backend}>
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
            { engine && <NotebookCell cell={e} engine={engine} />}
          </CellListDraggableCell>
        ))}
      </DndProvider>
    </div>
  );
});

export default CellList;
