import Tippy from "@tippyjs/react";
import {
  NodeViewContent,
  NodeViewRendererProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import React, {
  ElementType,
  MouseEvent,
  PropsWithChildren,
  useRef,
  useState,
} from "react";
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

    let hover = globalState.activeBlocks[id];
    console.log("render", childList.current);
    return (
      <NodeViewWrapper className={styles.block}>
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
                data-drag-handle // Ensures that the element can only be dragged using the drag handle.
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
