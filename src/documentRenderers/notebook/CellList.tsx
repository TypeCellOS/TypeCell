import { observer } from "mobx-react-lite";
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { VscDiffAdded } from "react-icons/vsc";
import { getEngineForDoc } from "../../typecellEngine/EngineWithOutput";
// import { renderLogger } from "../logger";
import { CellListModel } from "../../models/CellListModel";
import TCDocument from "../../store/TCDocument";
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
  const engine = getEngineForDoc(props.document);
  const cellList = new CellListModel(props.document.id, props.document.data);
  // if (!(props.document.data as any)._aa) {
  //   (props.document.data as any)._aa = 1;
  // }
  // console.log("doc", (props.document.data as any)._aa++);
  // console.log((cellList as any).fragment._dEH);
  // const cellList = new CellListModel(props.document.data.getXmlFragment("cells"));
  // const cellList = local.cellList;
  function onAdd(i: number) {
    cellList.addCell(i);
  }

  function remove(i: number) {
    cellList.removeCell(i);
  }

  const cells = cellList.cells;
  // renderLogger.log("cellList");
  return (
    <div className="cellList">
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
            <NotebookCell cell={e} engine={engine} />
          </CellListDraggableCell>
        ))}
      </DndProvider>
    </div>
  );
});

export default CellList;
