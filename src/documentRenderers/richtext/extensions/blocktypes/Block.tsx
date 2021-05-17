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
  useRef,
  useState,
} from "react";
import { useDrag, useDrop } from "react-dnd";
import SideMenu from "../../SideMenu";
import styles from "./Block.module.css";

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
function Block(type: ElementType, attrs: Record<string, any> = {}) {
  return observer(function Component(
    props: PropsWithChildren<NodeViewRendererProps>
  ) {
    const mouseCaptureRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const outerRef = useRef<HTMLDivElement>(null);
    const childList = useRef<any>(undefined);
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
        item: { getPos: props.getPos, node: props.node },
      };
    }, [props.getPos, props.node]);

    const [{}, drop] = useDrop<DnDItemType, any, any>(
      () => ({
        accept: "block",
        hover(item, monitor) {
          // TODO: show drop line
        },
        drop(item, monitor) {
          if (typeof props.getPos === "boolean") {
            throw new Error("unexpected getPos type");
          }

          // We're dropping item.node (source) to props.node (target)
          // Should we move source to the top of bottom of target? Let's find out
          // (logic from https://react-dnd.github.io/react-dnd/examples/sortable/simple)

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
          const posBeforeTargetNode = props.getPos() - 1;
          const posAfterTargetNode = props.getPos() + props.node.nodeSize;

          // create a new transaction
          const tr = props.editor.state.tr;
          const oldDocSize = tr.doc.nodeSize;

          // delete the old block
          deleteBlock(tr, item.getPos(), item.node);

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
          // insert the block at new position
          tr.insert(posToInsert, item.node);
          // execute transaction
          props.editor.view.dispatch(tr);
        },
      }),
      [props.getPos, props.node]
    );

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
                />
              </Tippy>
            </div>
            {type === "code" ? ( // Wraps content in "pre" tags if the content is code.
              <pre>
                <NodeViewContent className={styles.content} as={type} />
              </pre>
            ) : (
              <NodeViewContent
                className={(attrs.class || "") + " " + styles.content}
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
