import { XYCoord } from "dnd-core";
import { observer } from "mobx-react-lite";
import React, { useRef, useState } from "react";
import { DropTargetMonitor, useDrag, useDrop } from "react-dnd";
import { VscTrash } from "react-icons/vsc";
import styles from "./CellListDraggableCell.module.css";
import { HoverTrackerContext } from "./HoverTrackerContext";

type Props = {
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onAddBefore: () => void;
  onAddAfter: () => void;
  onRemove: () => void;
  children: any;
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
  const [dndHoverPos, setDndHoverPos] = useState<"top" | "bottom">("top");

  function calcDrag(item: DragItem, monitor: DropTargetMonitor) {
    if (!ref.current) {
      return;
    }
    const dragIndex = item.index;
    let hoverIndex = props.index;

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
      hoverIndex--;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      hoverIndex++;
    }

    if (hoverIndex === dragIndex) {
      return;
    }

    return {
      dragIndex,
      hoverIndex,
    };
  }

  const [{ hovered: dndHovered }, drop] = useDrop({
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

      setDndHoverPos(
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

  // When we're hovering over the cell in the parent frame (e.g.: code editor)
  const [hovering, setHovering] = useState(false);

  // When we're hovering over the cell output in a sandboxed frame (see SandboxedExecutionHost)
  const [childHovering, setChildHovering] = useState(false);

  return (
    <HoverTrackerContext.Provider
      value={{
        setHover: (hover: boolean) => {
          setChildHovering(hover);
        },
      }}>
      <div
        className={
          "cellList-item " + (childHovering || hovering ? "hover" : "")
        }
        ref={ref}
        style={{ opacity }}
        onMouseOver={() => {
          setHovering(true);
        }}
        onMouseLeave={() => {
          setHovering(false);
        }}>
        {dndHovered && dndHoverPos === "top" && (
          <div className="dropruler top" />
        )}
        <div
          className="shoulder"
          draggable="true"
          title="Drag to move cell"
          ref={dragSourceRef}>
          <button
            className={styles.delete}
            title="Delete"
            onClick={() => props.onRemove()}>
            <VscTrash />
          </button>
        </div>

        <button
          onClick={props.onAddBefore}
          className="add_cell before"
          title="Add cell">
          <span></span>
        </button>
        {props.children}
        <button
          onClick={props.onAddAfter}
          className="add_cell after"
          title="Add cell">
          <span></span>
        </button>
        {dndHovered && dndHoverPos === "bottom" && (
          <div className="dropruler bottom" />
        )}
      </div>
    </HoverTrackerContext.Provider>
  );
});

export default CellListDraggableCell;
