import Tippy from "@tippyjs/react";
import {
  NodeViewContent,
  NodeViewRendererProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { makeAutoObservable, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { DOMOutputSpec, Node } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import React, {
  ElementType,
  MouseEvent,
  PropsWithChildren,
  useRef,
  useState,
} from "react";
import { useDrag, useDrop } from "react-dnd";
import SideMenu from "../../menus/SideMenu";
import mergeAttributesReact from "../../util/mergeAttributesReact";
import TypeCellComponent from "../typecellnode/TypeCellComponent";
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
    // NOTE: we might want to extend ElementType itself instead of declaring it like this
    let domType: ElementType | "typecell";
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

          // ProseMirror token positions just before and just after the target block
          const posBeforeTargetNode = props.getPos();
          let posAfterTargetNode = props.getPos() + props.node.nodeSize;

          // create a new transaction
          const tr = props.editor.state.tr;
          const oldDocSize = tr.doc.nodeSize;

          // delete the old block
          deleteBlock(tr, item.getPos(), item.node);

          // Determine rectangle on screen
          const hoverBoundingRect =
            mouseCaptureRef!.current!.getBoundingClientRect();

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
          <NodeViewContent
            as={domType}
            {...domAttrs}
            ref={(props as any).contentWrapperRef}
          />
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
    function updateHover() {
      if (globalState.activeBlock !== id) {
        runInAction(() => {
          delete globalState.activeBlocks[globalState.activeBlock];
          globalState.activeBlocks[id] = true;
          globalState.activeBlock = id;
        });
      }
    }

    function onMouseOver(e: MouseEvent) {
      // Prevents any accidental re-renders when dragging.
      if (!canDrop) {
        updateHover();
      }
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
      <NodeViewWrapper className={`${styles.block}`} ref={outerRef}>
        <div className={styles.inner + " inner"} ref={innerRef}>
          <div
            className={styles.handleContainer}
            ref={dragRef}
            // This is needed because otherwise pressing key up when positioned just after draghandle doesn't work
            contentEditable={false}>
            <Tippy
              content={<SideMenu onDelete={onDelete}></SideMenu>}
              trigger={"click"}
              placement={"left"}
              interactive={true}>
              <div
                className={
                  styles.handle + (hover ? " " + styles.hover : "")
                }></div>
            </Tippy>
          </div>
          {renderContentBasedOnDOMType(
            domType,
            domAttrs,
            placeholderAttrs,
            props
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
          contentEditable={false}>
          {/* space content is needed because otherwise keyboard navigation doesn't work well */}{" "}
        </div>
      </NodeViewWrapper>
    );
  });
}

export default Block;
function renderContentBasedOnDOMType(
  // NOTE: we might want to extend ElementType itself instead of declaring it like this
  domType: ElementType,
  domAttrs: { [attr: string]: string | null | undefined },
  placeholderAttrs: { [attr: string]: string | null | undefined },
  props: React.PropsWithChildren<NodeViewRendererProps>
): JSX.Element | null | undefined {
  if (domType === "pre") {
    // Wraps in "pre" tags if the content is code.
    // The <select> inside <pre> controls programming language selection and update
    // Available programming languages come from the "lowlight" extension
    // The NodeViewContent is rendered inside a <code> tag
    return (
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
            // each available language is transformed into an <option> element
            // @ts-ignore
            .map((lang, index) => {
              return (
                <option key={props.node.attrs["block-id"] + index} value={lang}>
                  {lang}
                </option>
              );
            })}
        </select>

        <NodeViewContent
          as={"code"}
          {...domAttrs}
          className={styles.codeBlockCodeContent}
          ref={(props as any).contentWrapperRef}
        />
      </pre>
    );
  } else if (props.node.type.name === "typecell") {
    return <TypeCellComponent node={props.node}></TypeCellComponent>;
  } else {
    return (
      <NodeViewContent
        as={domType}
        {...mergeAttributesReact(placeholderAttrs, domAttrs)}
        ref={(props as any).contentWrapperRef}
      />
    );
  }
}
