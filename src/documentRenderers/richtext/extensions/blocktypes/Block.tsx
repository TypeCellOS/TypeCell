import Tippy from "@tippyjs/react";
import {
  NodeViewContent,
  NodeViewRendererProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { makeAutoObservable } from "mobx";
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

    function deleteBlock(pos: number) {
      let block: Node = new Node();
      props.editor.state.doc.forEach(function f(node, offset, index) {
        if (offset <= pos && pos < offset + node.nodeSize) {
          block = node;
          const tr = props.editor.state.tr.delete(
            offset,
            offset + node.nodeSize
          );
          props.editor.view.dispatch(tr);
        }
      });
      return block;
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
      debugger;
      return { type: "block" };
    });

    const [{ initialMousePos, finalMousePos }, dropRef] = useDrop(() => ({
      accept: "block",
      drop(item, monitor) {
        // Mouse cursor x, y coordinates.
        const initialMouseCoords = monitor.getInitialClientOffset();
        const finalMouseCoords = monitor.getClientOffset();
        if (initialMouseCoords === null || finalMouseCoords === null) {
          return;
        }
        // Mouse cursor positions which use ProseMirror token indexing.
        const initialMousePos = props.editor.view.posAtCoords({
          left: initialMouseCoords.x,
          top: initialMouseCoords.y,
        });
        const finalMousePos = props.editor.view.posAtCoords({
          left: finalMouseCoords.x,
          top: finalMouseCoords.y,
        });
        if (initialMousePos && finalMousePos) {
          // Top, left, bottom, and right side dimensions of the block under the cursor.
          const dimensions = nodeCoordsAtPos(finalMousePos.pos);
          // ProseMirror token positions just before and just after the block under the cursor.
          const posBeforeNode = props.editor.view.posAtCoords({
            left: dimensions.left,
            top: dimensions.top,
          });
          const posAfterNode = props.editor.view.posAtCoords({
            left: dimensions.left,
            top: dimensions.bottom,
          });
          console.log("PosBefore: ", posBeforeNode);
          console.log("PosAfter: ", posAfterNode);
          console.log("PosFinal: ", finalMousePos.pos);

          // Checks if move was above or below the target block's center line to drop above or below it.
          if (
            finalMouseCoords.y <= (dimensions.top + dimensions.bottom) / 2 &&
            posBeforeNode
          ) {
            let block: Node = deleteBlock(initialMousePos.pos);
            insertBlock(posBeforeNode.pos, block);
          } else if (posAfterNode) {
            let block: Node = deleteBlock(initialMousePos.pos);
            insertBlock(posAfterNode.pos, block);
          }
        }
      },
    }));

    // Ref which allows an element to both act as a drop target and drag preview.
    function dropAndPreviewRef(el: ConnectableElement) {
      dropRef(el);
      dragPreviewRef(el);
    }

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
        delete globalState.activeBlocks[globalState.activeBlock];
        globalState.activeBlocks[id] = true;
        globalState.activeBlock = id;
      }
    }

    // <div
    //       // Entire block within the node view wrapper
    //       ref={dropAndPreviewRef}
    //       className={styles.block}>
    //       <div
    //         // Drag handle
    //         ref={dragRef}
    //         className={styles.handle}
    //       />

    let hover = globalState.activeBlocks[id];
    console.log("render", childList.current);
    return (
      <NodeViewWrapper className={styles.block} ref={dropAndPreviewRef}>
        <div className={styles.mouseCapture} onMouseOver={onMouseOver}></div>
        <div className={styles.inner + " inner"}>
          <div className={styles.handleContainer}>
            <Tippy
              content={<SideMenu onDelete={onDelete}></SideMenu>}
              trigger={"click"}
              placement={"left"}
              interactive={true}>
              <div
                className={styles.handle + (hover ? " " + styles.hover : "")}
                contentEditable="false"
                unselectable="on"
                draggable="true"
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
