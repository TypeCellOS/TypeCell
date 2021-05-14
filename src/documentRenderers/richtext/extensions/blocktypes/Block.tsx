import React, { ElementType, PropsWithChildren, useRef } from "react";
import {
  NodeViewContent,
  NodeViewRendererProps,
  NodeViewWrapper,
} from "@tiptap/react";
import Tippy from "@tippyjs/react";
import {
  ConnectableElement,
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { Node } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import SideMenu from "../../SideMenu";

import styles from "./Block.module.css";

/**
 * This function creates a React component that represents a block in the editor. This is so that editor blocks can be
 * rendered with a functional drag handle next to them. The pop-up menu that appears after clicking a drag handle is
 * also handled here.
 * @param type	The type of HTML element to be rendered as a block.
 * @returns			A React component, to be used in a TipTap node view.
 */
function Block(type: ElementType) {
  return function Component(props: PropsWithChildren<NodeViewRendererProps>) {
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
        console.log("pos: ", offset);
        if (offset <= pos && pos < offset + node.nodeSize) {
          block = node;
          console.log(block);
          const tr = props.editor.state.tr.delete(
            offset,
            offset + node.nodeSize
          );
          props.editor.view.dispatch(tr);
        }
      });
      return block;
    }

    const [{ isDragging }, dragRef, dragPreviewRef] = useDrag(() => ({
      type: "block",
    }));

    const [{ initialMousePos, finalMousePos }, dropRef] = useDrop(() => ({
      accept: "block",
      drop(item, monitor) {
        const initialMousePos = monitor.getInitialClientOffset();
        const finalMousePos = monitor.getClientOffset();
        console.log("OriginalMousePos: ", initialMousePos);
        console.log("CurrentMousePos: ", finalMousePos);
        if (initialMousePos === null || finalMousePos === null) {
          return;
        }
        const initialPos = props.editor.view.posAtCoords({
          left: initialMousePos.x,
          top: initialMousePos.y,
        });
        const finalPos = props.editor.view.posAtCoords({
          left: finalMousePos.x,
          top: finalMousePos.y,
        });
        if (initialPos && finalPos) {
          let block: Node = deleteBlock(initialPos.pos);
          insertBlock(finalPos.pos, block);
        }
      },
    }));

    // Ref which allows an element to both act as a drop target and drag preview.
    function dropAndPreviewRef(el: ConnectableElement) {
      dropRef(el);
      dragPreviewRef(el);
    }

    return (
      <NodeViewWrapper className={styles.wrapper}>
        <div
          // Entire block within the node view wrapper
          ref={dropAndPreviewRef}
          className={styles.block}>
          <div
            // Drag handle
            ref={dragRef}
            className={styles.handle}
          />
          {type === "code" ? ( // Wraps content in "pre" tags if the content is code.
            <pre>
              <NodeViewContent className={styles.content} as={type} />
            </pre>
          ) : (
            <NodeViewContent className={styles.content} as={type} />
          )}
        </div>
      </NodeViewWrapper>
    );
  };
}

export default Block;
