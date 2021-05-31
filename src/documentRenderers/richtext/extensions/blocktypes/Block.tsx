import Tippy from "@tippyjs/react";
import {
  NodeViewContent,
  NodeViewRendererProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { makeAutoObservable, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { Node, DOMOutputSpec } from "prosemirror-model";
import { TextSelection, Transaction } from "prosemirror-state";
import {
  ElementType,
  MouseEvent,
  PropsWithChildren,
  useRef,
  useState,
} from "react";
import { useDrag, useDrop } from "react-dnd";
import SideMenu from "../../SideMenu";
import styles from "./Block.module.css";

/**
 * A global store that keeps track of which block is being hovered over
 */
let globalState = makeAutoObservable({
  activeBlocks: {} as any, // using this pattern to prevent multiple rerenders
  activeBlock: 0,
});

type DnDItemType = {
  getPos: () => number;
  node: Node;
};

/**
 * This function creates a React component that represents a block in the editor. This is so that editor blocks can be
 * rendered with a functional drag handle next to them. The pop-up menu that appears after clicking a drag handle is
 * also handled here.
 * @param type	The type of HTML element to be rendered as a block.
 * @returns			A React component, to be used in a TipTap node view.
 */
function Block(toDOM: (node: Node<any>) => DOMOutputSpec, options: any) {
  return observer(function Component(
    props: PropsWithChildren<NodeViewRendererProps>
  ) {
    const domOutput = toDOM(props.node);
    let domType: ElementType;
    let domAttrs: { [attr: string]: string | null | undefined } = {};

    // Used to store multi-selection data
    let selectedBlocks: Array<Node> = [];
    let selectedRange: Array<number> = [];

    if (Array.isArray(domOutput)) {
      // We assume here that domOutput[0] is indeed a valid HTML tag
      domType = domOutput[0] as ElementType;
      if (domOutput[1]) {
        if (typeof domOutput[1] !== "object" || Array.isArray(domOutput[1])) {
          throw new Error("toDOM does not return a valid attribute parameter");
        }
        domAttrs = domOutput[1];
      }
    } else {
      throw new Error("toDOM does not return a valid DOM Type");
    }

    const mouseCaptureRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const outerRef = useRef<HTMLDivElement>(null);
    const [id] = useState(Math.random());

    const [{ isDragging }, dragRef, dragPreview] = useDrag<
      DnDItemType,
      any,
      any
    >(() => {
      if (typeof props.getPos === "boolean") {
        throw new Error("unexpected getPos type");
      }
      return {
        type: "block",
        item: { getPos: props.getPos, node: props.node },
      };
    }, [props.getPos, props.node]);

    const [{}, drop] = useDrop<DnDItemType, any, any>(
      () => ({
        accept: "block",
        hover(item, monitor) {
          // TODO: show drop line
          // https://github.com/YousefED/typecell-next/issues/53
        },
        drop(item, monitor) {
          if (typeof props.getPos === "boolean") {
            throw new Error("unexpected getPos type");
          }

          // We're dropping item.node (source) to props.node (target)
          // Should we move source to the top of bottom of target? Let's find out
          // (logic from https://react-dnd.github.io/react-dnd/examples/sortable/simple)

          // Get all selected blocks, empty if there's only a basic text selection
          const nodes = getSelectedBlocks();

          // Determine rectangle on screen
          const hoverBoundingRect =
            mouseCaptureRef.current!.getBoundingClientRect();

          // Get vertical middle
          const hoverMiddleY =
            (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

          // Determine mouse position
          const clientOffset = monitor.getClientOffset();

          // Get pixels to the top
          const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

          // ProseMirror token positions just before and just after the target block
          const posBeforeTargetNode = props.getPos();
          const posAfterTargetNode = props.getPos() + props.node.nodeSize;

          // Create a new transaction
          const tr = props.editor.state.tr;
          const oldDocSize = tr.doc.nodeSize;

          // Get range of selected blocks
          selectedRange = getSelectedRange();

          // delete the old block/s
          if (selectedRange[0] !== -1 && selectedRange[1] !== -1) {
            tr.deleteRange(selectedRange[0], selectedRange[1]);
          } else {
            tr.deleteRange(item.getPos(), item.getPos() + item.node.nodeSize);
          }

          let posToInsert =
            hoverClientY < hoverMiddleY
              ? posBeforeTargetNode
              : posAfterTargetNode;

          if (item.getPos() < posToInsert) {
            // we're moving an item downwards. As "delete" happens before "insert",
            // we need to adjust the insert position

            // note that we cannot simply use item.node.nodeSize for deleted length;
            // it's possible more has been deleted, for example if the state is <ul><li><p>text</p></li></ul>
            // deleteBlock would have deleted the empty <ul> when deleting the <li>
            const deletedLength = oldDocSize - tr.doc.nodeSize;
            posToInsert -= deletedLength;
          }
          // insert the block/s at new position
          selectedBlocks = getSelectedBlocks();
          console.log(selectedBlocks);
          if (selectedBlocks.length > 0) {
            let nextPos = posToInsert;
            for (let node of selectedBlocks) {
              tr.insert(nextPos, node);
              nextPos += node.nodeSize;
            }
          } else {
            tr.insert(posToInsert, item.node);
          }
          // Execute transaction
          props.editor.view.dispatch(tr);

          // Set new selection if dragging multiple blocks
          // Must be a new transaction since the document changes
          if (selectedBlocks.length > 0) {
            const newSelection = props.editor.state.tr.setSelection(
              TextSelection.create(
                props.editor.state.doc,
                posToInsert + 1,
                posToInsert + (selectedRange[1] - selectedRange[0])
              )
            );
            props.editor.view.dispatch(newSelection);
          }
        },
      }),
      [props.getPos, props.node]
    );

    // The node is not supposed to be draggable, for example, we could be dealing with a paragraph
    // inside a <li> or <blockquote>. In that case, the wrapper should be draggable, not this item itself.
    if (!props.node.attrs["block-id"]) {
      return (
        <NodeViewWrapper>
          <NodeViewContent as={domType} {...domAttrs} />
        </NodeViewWrapper>
      );
    }

    function onDelete() {
      if (typeof props.getPos === "boolean") {
        throw new Error("unexpected");
      }

      if (selectedBlocks.length > 0) {
        props.editor.view.dispatch(
          props.editor.state.tr.deleteRange(selectedRange[0], selectedRange[1])
        );
      } else {
        props.editor.view.dispatch(
          props.editor.state.tr.deleteRange(
            props.getPos(),
            props.getPos() + props.node.nodeSize
          )
        );
      }
    }

    /**
     * We use a special div and a mouse-over event handled in Javascript to determine the hovered element.
     * Why not just handle this in CSS using :hover? Two reasons:
     * 1) If we're in a nested list, we only want the drag handle for the deepest Block to be shown.
     *    CSS will always trigger :hover for the deep block and it's parent block, and make two handles appear.
     *    It seems like there's no easy way around that
     * 2) We use a special MouseCapture div that extends to the entire page with, so that we also capture events when we're hovering
     *    over the "white" area on the side of the document. This is a little bit hacky, but works well from a user perspective
     *    (the div is absolutely positioned, and this could cause other issues with contenteditable selections, etc. We might
     *    want to move away from this solution later, and for example capture a global mousemove and calculate hover from that)
     */
    function onMouseOver(e: MouseEvent) {
      if (globalState.activeBlock !== id) {
        runInAction(() => {
          delete globalState.activeBlocks[globalState.activeBlock];
          globalState.activeBlocks[id] = true;
          globalState.activeBlock = id;
        });
      }
    }

    /**
     * Updates the multi-block selection. If this block is outside this selection, the selection is cancelled and the
     * cursor is moved to the start of this block. Runs every time the drag-handle/side-menu button is clicked, as all
     * operations which utilize multi-block selections are triggered from the drag-handle in some way.
     */
    function updateSelection() {
      if (typeof props.getPos === "boolean") {
        throw new Error("unexpected");
      }

      selectedBlocks = getSelectedBlocks();
      selectedRange = getSelectedRange();

      console.log(selectedBlocks, selectedRange, props.getPos());

      // Checks if block position is not within the multi-block selection and a multi-block selection exists.
      if (
        (props.getPos() < selectedRange[0] ||
          props.getPos() >= selectedRange[1]) &&
        selectedBlocks.length > 0
      ) {
        // Sets the selection to the start of the block
        props.editor.view.dispatch(
          props.editor.state.tr.setSelection(
            TextSelection.create(props.editor.state.doc, props.getPos() + 1)
          )
        );

        // Updates the multi-block selection since the selection was reset.
        selectedBlocks = getSelectedBlocks();
        selectedRange = getSelectedRange();
      }
    }

    /**
     * Gets all selected blocks.
     * @returns An array of nodes, each corresponding to a selected block. Empty if selection is within a single block.
     */
    function getSelectedBlocks(): Array<Node> {
      const selectedBlocks: Array<Node> = [];
      props.editor.state.doc.descendants(function (node, offset, parent) {
        if (node.attrs["block-selected"] && !parent.attrs["block-selected"]) {
          selectedBlocks.push(node);
        }
      });
      return selectedBlocks;
    }

    /**
     * Gets the start and end positions of the multi-block selection.
     * @returns A 2-element array containing the start and end positions of the multi-block selection. Both values are
     * -1 if selection is within a single block.
     */
    function getSelectedRange(): Array<number> {
      let start = Number.MAX_VALUE;
      let end = -1;
      props.editor.state.doc.descendants(function (node, offset) {
        if (node.attrs["block-selected"]) {
          if (offset < start) {
            start = offset;
          }
          if (offset + node.nodeSize > end) {
            end = offset + node.nodeSize;
          }
        }
      });
      return [start, end];
    }

    // if activeBlocks[id] is set, this block is being hovered over
    let hover = globalState.activeBlocks[id];

    // setup react DnD
    drop(outerRef);
    dragPreview(innerRef);

    return (
      <NodeViewWrapper className={styles.block}>
        <div ref={outerRef}>
          <div className={styles.inner + " inner"} ref={innerRef}>
            <div className={styles.handleContainer} ref={dragRef}>
              <Tippy
                content={<SideMenu onDelete={onDelete}></SideMenu>}
                trigger={"click"}
                placement={"left"}
                interactive={true}>
                <div
                  contentEditable={false} // This is needed because otherwise pressing key up when positioned just after draghandle doesn't work
                  className={styles.handle + (hover ? " " + styles.hover : "")}
                  onClick={updateSelection}
                />
              </Tippy>
            </div>
            {domType === "code" ? ( // Wraps content in "pre" tags if the content is code.
              <pre>
                <NodeViewContent as={domType} {...domAttrs} />
              </pre>
            ) : (
              <div>
                <NodeViewContent as={domType} {...domAttrs} />
              </div>
            )}
          </div>
          <div
            className={styles.mouseCapture}
            onMouseOver={onMouseOver}
            ref={mouseCaptureRef}
            contentEditable={false}></div>
        </div>
      </NodeViewWrapper>
    );
  });
}

export default Block;
