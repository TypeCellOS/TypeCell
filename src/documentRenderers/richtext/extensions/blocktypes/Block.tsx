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
import React, {
  ElementType,
  MouseEvent,
  PropsWithChildren,
  RefObject,
  useRef,
  useState,
} from "react";
import { useDrag, useDrop, XYCoord } from "react-dnd";
import SideMenu from "../../menus/SideMenu";
import mergeAttributesReact from "../../util/mergeAttributesReact";
import { forSelectedBlocks } from "../../multiselection/forSelectedBlocks";
import styles from "./Block.module.css";
/**
 * A global store that keeps track of which block is being hovered over
 */
let globalState = makeAutoObservable({
  activeBlocks: {} as any, // using this pattern to prevent multiple rerenders
  activeBlock: 0,
  aboveCenterLine: false, // True if mouse cursor lies above this block's center line
});

type DnDItemType = {
  getPos: () => number;
  node: Node;
};

// Used to store temporary multi-selection data
let selectedBlocks: Array<Node> = [];
let selectedRange: Array<number> = [];

/**
 * This function creates a React component that represents a block in the editor. This is so that editor blocks can be
 * rendered with a functional drag handle next to them. The pop-up menu that appears after clicking a drag handle is
 * also handled here.
 * @param type	The type of HTML element to be rendered as a block.
 * @returns			A React component, to be used in a TipTap node view.
 */
function Block(
  toDOM: (node: Node<any>) => DOMOutputSpec,
  options: {
    placeholder?: string;
    placeholderOnlyWhenSelected?: boolean;
  }
) {
  return observer(function Component(
    props: PropsWithChildren<NodeViewRendererProps>
  ) {
    const domOutput = toDOM(props.node);
    let domType: ElementType;
    let domAttrs: { [attr: string]: string | null | undefined } = {};

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
    // if activeBlocks[id] is set, this block is being hovered over
    let hover = globalState.activeBlocks[id];

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
          // Prevents constant re-renders when hovering over nested blocks.
          if (!monitor.isOver({ shallow: true })) {
            return;
          }

          // Checks if cursor is above the center line of the hovered node.
          const hoverBoundingRect =
            mouseCaptureRef!.current!.getBoundingClientRect();

          runInAction(() => {
            globalState.aboveCenterLine = cursorInUpperHalf(
              monitor.getClientOffset()!.y,
              hoverBoundingRect
            );
          });

          if (globalState.activeBlock !== id) {
            updateHover();
          }
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

          let posToInsert = cursorInUpperHalf(
            monitor.getClientOffset()!.y,
            hoverBoundingRect
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
          // insert the block/s at new position
          selectedBlocks = getSelectedBlocks();
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
                // List
                posToInsert + (selectedBlocks[0].isTextblock ? 1 : 2),
                posToInsert +
                  (selectedRange[1] - selectedRange[0]) -
                  (selectedBlocks[selectedBlocks.length - 1].isTextblock
                    ? 1
                    : 2)
              )
            );
            props.editor.view.dispatch(newSelection);
          }
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
    function updateHover() {
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

      // Checks if block position is outside the multi-block selection and a multi-block selection exists.
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

    function onMouseOver(e: MouseEvent) {
      // Prevents any accidental re-renders when dragging.
      if (!canDrop) {
        updateHover();
      }
    }

    /**
     * Gets all selected blocks.
     * @returns An array of nodes, each corresponding to a selected block. Empty if selection is within a single block.
     */
    function getSelectedBlocks(): Array<Node> {
      const selectedBlocks: Array<Node> = [];
      function getBlocks(node: Node) {
        selectedBlocks.push(node);
      }

      forSelectedBlocks(props.editor.state, getBlocks);

      return selectedBlocks;
    }

    /**
     * Gets the start and end positions of the multi-block selection.
     * @returns A 2-element array containing the start and end positions of the multi-block selection. If the selection
     * is within a single block, the first array value equals Number.MAX_VALUE while the second element equals -1.
     * However, it is better to check for this if getSelectedBlocks() returns an empty array.
     */
    function getSelectedRange(): Array<number> {
      let start = Number.MAX_VALUE;
      let end = -1;
      function getRange(node: Node, offset?: number) {
        if (offset !== undefined) {
          if (offset < start) {
            start = offset;
          }
          if (offset + node.nodeSize > end) {
            end = offset + node.nodeSize;
          }
        }
      }

      forSelectedBlocks(props.editor.state, getRange);

      return [start, end];
    }

    /**
     * Checks if the mouse cursor lies above the vertical center line of the bounding rectangle of a HTML element.
     * @param rect      The bounding rectangle of the HTML element.
     * @param mouseYPos The mouse position Y coordinate.
     * @returns True if cursor is above the center line of the element, false otherwise.
     */
    function cursorInUpperHalf(mouseYPos: number, rect: DOMRect) {
      // Get vertical middle
      const hoverMiddleY = (rect.bottom - rect.top) / 2;

      // Get pixels to the top
      const hoverClientY = mouseYPos - rect.top;
      // console.log(hoverClientY, hoverMiddleY);
      return hoverClientY < hoverMiddleY;
    }

    // setup react DnD
    drop(outerRef);
    dragPreview(innerRef);

    /*
    Our custom Placeholder logic. We have to do this ourselves because:
    a) official Placeholder extension doesn't work well on nodeviews
    b) We want to have some Blocks use placeholderOnlyWhenSelected, and some not
    */
    const getPos = props.getPos;
    if (typeof getPos === "boolean") {
      throw new Error("unexpected boolean getPos");
    }
    const pos = getPos();
    const anchor = props.editor.state.selection.anchor;
    const hasAnchor = anchor >= pos && anchor <= pos + props.node.nodeSize;
    const isEmpty = !props.node.isLeaf && !props.node.textContent;
    const placeholder =
      (isEmpty &&
        (!options.placeholderOnlyWhenSelected || hasAnchor) &&
        options.placeholder) ||
      undefined;

    const placeholderAttrs = placeholder
      ? { "data-placeholder": placeholder, class: "is-empty" }
      : {};

    return (
      <NodeViewWrapper className={`${styles.block}`}>
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
            {domType === "pre" ? ( // Wraps content in "pre" tags if the content is code.
              <pre className={styles.codeBlockPre}>
                <select
                  className={styles.codeBlockLanguageSelector}
                  value={props.node.attrs["language"]}
                  onChange={(event) => {
                    // @ts-ignore
                    props.updateAttributes({
                      language: event.target.value,
                    });
                  }}>
                  <option value="null">auto</option>
                  <option disabled>—</option>
                  {props.extension.options.lowlight
                    .listLanguages()
                    // @ts-ignore
                    .map((lang, index) => {
                      return (
                        <option
                          key={props.node.attrs["block-id"] + index}
                          value={lang}>
                          {lang}
                        </option>
                      );
                    })}
                </select>

                <NodeViewContent
                  as={"code"}
                  {...domAttrs}
                  className={styles.codeBlockCodeContent}
                />
              </pre>
            ) : (
              <div>
                <NodeViewContent
                  as={domType}
                  {...mergeAttributesReact(placeholderAttrs, domAttrs)}
                />
              </div>
            )}
          </div>
          <div
            className={`${styles.mouseCapture} ${
              hover && canDrop
                ? " " +
                  (globalState.aboveCenterLine
                    ? styles.topIndicator
                    : styles.bottomIndicator)
                : ""
            }`}
            onMouseOver={onMouseOver}
            ref={mouseCaptureRef}
            contentEditable={false}></div>
        </div>
      </NodeViewWrapper>
    );
  });
}

export default Block;
