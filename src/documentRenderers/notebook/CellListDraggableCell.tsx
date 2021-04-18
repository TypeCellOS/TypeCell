import { XYCoord } from "dnd-core";
import { observer } from "mobx-react-lite";
import React, { useRef, useState } from "react";
import { DropTargetMonitor, useDrag, useDrop } from "react-dnd";

type Props = {
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onAddBefore: () => void;
  onAddAfter: () => void;
  onRemove: () => void;
};

interface DragItem {
  index: number;
  // id: string;
  type: string;
}

const CellListDraggableCell: React.FC<Props> = observer((props) => {
  const [{ isDragging }, drag] = useDrag({
    item: { type: "CELL", index: props.index },
    type: "CELL",
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const ref = useRef<HTMLDivElement>(null);
  const dragSourceRef = useRef<HTMLDivElement>(null);
  const [hoverPos, setHoverPos] = useState<"top" | "bottom">("top");

  function calcDrag(item: DragItem, monitor: DropTargetMonitor) {
    if (!ref.current) {
      return;
    }
    const dragIndex = item.index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = ref.current?.getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    return {
      dragIndex,
      hoverIndex,
    };
  }

  const [{ hovered }, drop] = useDrop({
    accept: "CELL",

    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      setHoverPos(
        hoverClientY < hoverMiddleY ? ("top" as "top") : ("bottom" as "bottom")
      );
    },
    drop: (item, monitor) => {
      const calc = calcDrag(item, monitor);
      if (!calc) {
        return;
      }
      props.moveCard(calc.dragIndex, calc.hoverIndex);
    },
    collect: (monitor) => {
      return {
        hovered: monitor.isOver(),
      };
    },
  });
  // console.log(monitor);

  const opacity = isDragging ? 1 : 1;
  drag(dragSourceRef, {});
  drop(ref);
  return (
    <div className="cellList-item" ref={ref} style={{ opacity }}>
      {hovered && hoverPos === "top" && <div className="dropruler top" />}
      <div
        className="shoulder"
        draggable="true"
        title="Drag to move cell"
        ref={dragSourceRef}></div>
      <button
        onClick={props.onAddBefore}
        className="add_cell before"
        title="Add cell">
        <span></span>
      </button>
      {props.children}
      {/* <NotebookCell cell={props.cell} onRemove={props.onRemove}></NotebookCell> */}
      <button
        onClick={props.onAddAfter}
        className="add_cell after"
        title="Add cell">
        <span></span>
      </button>
      {hovered && hoverPos === "bottom" && <div className="dropruler bottom" />}
    </div>
  );
});

export default CellListDraggableCell;
