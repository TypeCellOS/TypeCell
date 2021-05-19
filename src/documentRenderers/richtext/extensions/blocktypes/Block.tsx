import Tippy from "@tippyjs/react";
import {
  NodeViewContent,
  NodeViewRendererProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { makeAutoObservable, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { Node } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import {
  default as React,
  ElementType,
  MouseEvent,
  PropsWithChildren,
  RefObject,
  useRef,
  useState,
} from "react";
import { useDrag, useDrop, XYCoord } from "react-dnd";
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
function Block(type: ElementType, options: any) {
  return observer(function Component(
    props: PropsWithChildren<NodeViewRendererProps>
  ) {
    const mouseCaptureRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const outerRef = useRef<HTMLDivElement>(null);
    const [id] = useState(Math.random());

    function deleteBlock(tr: Transaction, pos: number, node: Node) {
      // use deleteRange
      // https://discuss.prosemirror.net/t/defining-a-container-node-that-gets-removed-when-empty/762
      return tr.deleteRange(pos, pos + node.nodeSize);
    }

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
        item: {
          getPos: props.getPos,
          node: props.node,
        },
      };
    }, [props.getPos, props.node]);

    const [{ isOver, canDrop, clientOffset }, drop] = useDrop<
      DnDItemType,
      any,
      any
    >(
      () => ({
        accept: "block",
        hover(item, monitor) {
          // IMPORTANT: mouseCaptureRef.current can refer to several nodes at once if they're nested.
          if (cursorInUpperHalf(mouseCaptureRef, monitor.getClientOffset())) {
            mouseCaptureRef.current!.className = styles.dragBefore;
          } else {
            mouseCaptureRef.current!.className = styles.dragAfter;
          }

          // Lists of all shown indicators above & below nodes.
          let dragBefore = document.getElementsByClassName(styles.dragBefore);
          let dragAfter = document.getElementsByClassName(styles.dragAfter);

          // Finds indicator above a node that is closest to cursor and hides all others.
          let beforeIndex = -1;
          let beforeMinDistance = Number.MAX_VALUE;
          if (dragBefore.length > 0) {
            // Finding closest indicator.
            let distance;
            for (let i = 0; i < dragBefore.length; i++) {
              distance =
                monitor.getClientOffset()!.y -
                dragBefore[i].getBoundingClientRect().top;
              if (0 <= distance && distance < beforeMinDistance) {
                beforeIndex = i;
                beforeMinDistance = distance;
              }
            }
            // Hiding all other indicators.
            for (let i = 0; i < dragBefore.length; i++) {
              if (i !== beforeIndex) {
                dragBefore[i].className = styles.mouseCapture;
              }
            }
          }

          // Finds indicator below a node that is closest to cursor and hides all others.
          let afterIndex = -1;
          let afterMinDistance = Number.MAX_VALUE;
          if (dragAfter.length > 0) {
            // Finding closest indicator.
            let distance;
            for (let i = 0; i < dragAfter.length; i++) {
              distance =
                dragAfter[i].getBoundingClientRect().bottom -
                monitor.getClientOffset()!.y;
              if (0 <= distance && distance < afterMinDistance) {
                afterIndex = i;
                afterMinDistance = distance;
              }
            }
            // Hiding all other indicators.
            for (let i = 0; i < dragAfter.length; i++) {
              if (i !== afterIndex) {
                dragAfter[i].className = styles.mouseCapture;
              }
            }
          }

          // If both an above and below indicator are shown, hide the one further from the cursor.
          if (beforeIndex >= 0 && afterIndex >= 0) {
            beforeMinDistance > afterMinDistance
              ? (dragBefore[beforeIndex].className = styles.mouseCapture)
              : (dragAfter[afterIndex].className = styles.mouseCapture);
          }
        },
        drop(item, monitor) {
          if (typeof props.getPos === "boolean") {
            throw new Error("unexpected getPos type");
          }

          // We're dropping item.node (source) to props.node (target)
          // Should we move source to the top of bottom of target? Let's find out
          // (logic from https://react-dnd.github.io/react-dnd/examples/sortable/simple)

          // ProseMirror token positions just before and just after the target block
          const posBeforeTargetNode = props.getPos() - 1;
          const posAfterTargetNode = props.getPos() + props.node.nodeSize;

          // create a new transaction
          const tr = props.editor.state.tr;
          const oldDocSize = tr.doc.nodeSize;

          // delete the old block
          deleteBlock(tr, item.getPos(), item.node);

          let posToInsert = cursorInUpperHalf(
            mouseCaptureRef,
            monitor.getClientOffset()
          )
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
          // insert the block at new position
          tr.insert(posToInsert, item.node);
          // execute transaction
          props.editor.view.dispatch(tr);
        },
        collect: (monitor) => ({
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
          clientOffset: monitor.getClientOffset(),
        }),
      }),
      [props.getPos, props.node]
    );

    // The node is not supposed to be draggable, for example, we could be dealing with a paragraph
    // inside a <li> or <blockquote>. In that case, the wrapper should be draggable, not this item itself.
    if (!props.node.attrs["block-id"]) {
      return (
        <NodeViewWrapper>
          <NodeViewContent className={styles.content} as={type} />
        </NodeViewWrapper>
      );
    }

    function onDelete() {
      if (typeof props.getPos === "boolean") {
        throw new Error("unexpected");
      }
      props.editor.view.dispatch(
        deleteBlock(props.editor.state.tr, props.getPos(), props.node)
      );
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
     * Checks if the mouse cursor lies in the upper half of the DOM node it is hovering over.
     * @param mouseCaptureRef Mouse position reference.
     * @param mouseOffset     Mouse position offset.
     * @returns True if cursor is in upper half of node, false otherwise.
     */
    function cursorInUpperHalf(
      mouseCaptureRef: RefObject<HTMLDivElement> | null,
      mouseOffset: XYCoord | null
    ) {
      // Determine rectangle on screen
      const hoverBoundingRect =
        mouseCaptureRef!.current!.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Get pixels to the top
      if (mouseOffset) {
        const hoverClientY = mouseOffset.y - hoverBoundingRect.top;

        return hoverClientY < hoverMiddleY;
      }
    }

    // if activeBlocks[id] is set, this block is being hovered over
    let hover = globalState.activeBlocks[id];

    // setup react DnD
    drop(outerRef);
    dragPreview(innerRef);

    // Clear all drop indicators
    let dragAfter = document.getElementsByClassName(styles.dragAfter);
    for (let i = 0; i < dragAfter.length; i++) {
      dragAfter[i].className = styles.mouseCapture;
    }

    let dragBefore = document.getElementsByClassName(styles.dragBefore);
    for (let i = 0; i < dragBefore.length; i++) {
      dragBefore[i].className = styles.mouseCapture;
    }

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
                />
              </Tippy>
            </div>
            {type === "code" ? ( // Wraps content in "pre" tags if the content is code.
              <pre>
                <NodeViewContent className={styles.content} as={type} />
              </pre>
            ) : (
              <NodeViewContent
                className={
                  (options.HTMLAttributes?.class || "") + " " + styles.content
                }
                as={type}
              />
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
