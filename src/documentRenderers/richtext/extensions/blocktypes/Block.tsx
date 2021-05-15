import Tippy from "@tippyjs/react";
import {
  NodeViewContent,
  NodeViewRendererProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { drop } from "lodash";
import { makeAutoObservable, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { Node } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import {
  default as React,
  ElementType,
  MouseEvent,
  PropsWithChildren,
  useRef,
  useState,
} from "react";
import { ConnectableElement, useDrag, useDrop } from "react-dnd";
import SideMenu from "../../SideMenu";
import styles from "./Block.module.css";

let globalState = makeAutoObservable({
  activeBlocks: {} as any, // using this pattern to prevent multiple rerenders
  activeBlock: 0,
});

/**
 * This function creates a React component that represents a block in the editor. This is so that editor blocks can be
 * rendered with a functional drag handle next to them. The pop-up menu that appears after clicking a drag handle is
 * also handled here.
 * @param type	The type of HTML element to be rendered as a block.
 * @returns			A React component, to be used in a TipTap node view.
 */
function Block(type: ElementType, attrs: Record<string, any> = {}) {
  return observer(function Component(
    props: PropsWithChildren<NodeViewRendererProps>
  ) {
    const mouseCaptureRef = useRef<HTMLDivElement>(null);
    const childList = useRef<any>(undefined);
    const [id] = useState(Math.random());

    function insertBlock(pos: number, block: Node) {
      props.editor.state.doc.forEach(function f(node, offset, index) {
        if (offset <= pos && pos < offset + node.nodeSize) {
          const tr: Transaction = props.editor.state.tr.insert(offset, block);
          props.editor.view.dispatch(tr);
        }
      });
    }

    function deleteBlock(pos: number, node: Node) {
      const tr = props.editor.state.tr.delete(pos, pos + node.nodeSize);
      props.editor.view.dispatch(tr);
      return node;
    }

    function nodeCoordsAtPos(pos: number) {
      const dimensions = {
        top: -1,
        left: -1,
        bottom: -1,
        right: -1,
      };
      props.editor.state.doc.forEach(function f(node, offset, index) {
        if (offset <= pos && pos < offset + node.nodeSize) {
          dimensions.top = props.editor.view.coordsAtPos(offset).top;
          dimensions.left = props.editor.view.coordsAtPos(offset).left;
          dimensions.bottom = props.editor.view.coordsAtPos(
            offset + node.nodeSize
          ).bottom;
          dimensions.right = props.editor.view.coordsAtPos(
            offset + node.nodeSize
          ).right;
        }
      });
      return dimensions;
    }

    const [{ isDragging }, dragRef, dragPreviewRef] = useDrag(() => {
      if (typeof props.getPos === "boolean") {
        throw new Error("unexpected getPos type");
      }
      return {
        type: "block",
        item: { getPos: props.getPos, node: props.node },
      };
    }, [props.getPos, props.node]);

    const [{}, drop] = useDrop(
      () => ({
        accept: "block",
        drop(item: any, monitor) {
          if (typeof props.getPos === "boolean") {
            throw new Error("unexpected getPos type");
          }

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

          const dimensions = nodeCoordsAtPos(item.getPos());
          // ProseMirror token positions just before and just after the block under the cursor.
          const posBeforeNode = props.getPos() - 1;
          const posAfterNode = props.getPos() + props.node.nodeSize;
          console.log("PosBefore: ", posBeforeNode);
          console.log("PosAfter: ", posAfterNode);
          // console.log("PosFinal: ", finalMousePos.pos);

          // Checks if move was above or below the target block's center line to drop above or below it.
          let block: Node = deleteBlock2(item.getPos(), item.node);

          console.log("block to move", block.toJSON());
          if (hoverClientY < hoverMiddleY) {
            console.log("before");
            insertBlock(posBeforeNode, block);
          } else if (posAfterNode) {
            console.log("after");
            insertBlock(posAfterNode, block);
          }
        },
      }),
      [props.getPos, props.node]
    );

    function onDelete() {
      if (typeof props.getPos === "boolean") {
        throw new Error("unexpected");
      }
      const pos = props.getPos();

      props.editor.commands.deleteRange({
        from: pos,
        to: pos + props.node.nodeSize,
      });
    }

    function onMouseOver(e: MouseEvent) {
      if (globalState.activeBlock !== id) {
        runInAction(() => {
          delete globalState.activeBlocks[globalState.activeBlock];
          globalState.activeBlocks[id] = true;
          globalState.activeBlock = id;
        });
      }
    }

    let hover = globalState.activeBlocks[id];
    drop(mouseCaptureRef);
    return (
      <NodeViewWrapper className={styles.block}>
        <div
          className={styles.mouseCapture}
          onMouseOver={onMouseOver}
          ref={mouseCaptureRef}></div>
        <div className={styles.inner + " inner"} ref={dragPreviewRef}>
          <div className={styles.handleContainer}>
            <Tippy
              content={<SideMenu onDelete={onDelete}></SideMenu>}
              trigger={"click"}
              placement={"left"}
              interactive={true}>
              <div
                className={styles.handle + (hover ? " " + styles.hover : "")}
                ref={dragRef}
              />
            </Tippy>
          </div>
          {type === "code" ? ( // Wraps content in "pre" tags if the content is code.
            <pre>
              <NodeViewContent className={styles.content} as={type} />
            </pre>
          ) : (
            <NodeViewContent
              contentEditable={true}
              className={(attrs.class || "") + " " + styles.content}
              as={type}
            />
          )}
        </div>
      </NodeViewWrapper>
    );
  });
}

export default Block;
