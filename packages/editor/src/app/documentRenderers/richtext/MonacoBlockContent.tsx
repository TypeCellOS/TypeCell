import { createTipTapBlock } from "@blocknote/core";
import { mergeAttributes } from "@tiptap/core";
// import styles from "../../Block.module.css";

// @ts-ignore
// @ts-ignore
// @ts-ignore
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { keymap } from "prosemirror-keymap";
import { EditorState, Selection } from "prosemirror-state";
import { EditorView, NodeView } from "prosemirror-view";
import React from "react";
import { MonacoElement } from "./MonacoElement";

function arrowHandler(
  dir: "up" | "down" | "left" | "right" | "forward" | "backward"
) {
  return (state: EditorState, dispatch: any, view: EditorView) => {
    if (state.selection.empty && view.endOfTextblock(dir)) {
      let side = dir === "left" || dir === "up" ? -1 : 1;
      let $head = state.selection.$head;
      let nextPos = Selection.near(
        state.doc.resolve(side > 0 ? $head.after() : $head.before()),
        side
      );
      console.log("nextPos", nextPos.$head.parent.type.name);
      if (nextPos.$head && nextPos.$head.parent.type.name === "monaco") {
        dispatch(state.tr.setSelection(nextPos));
        return true;
      }
    }
    return false;
  };
}

const arrowHandlers = keymap({
  ArrowLeft: arrowHandler("left"),
  ArrowRight: arrowHandler("right"),
  ArrowUp: arrowHandler("up"),
  ArrowDown: arrowHandler("down"),
} as any);

const ComponentWithWrapper = React.forwardRef(
  (props: NodeViewProps & { block: any; htmlAttributes: any }, ref) => {
    const { htmlAttributes, ...restProps } = props;
    return (
      <NodeViewWrapper
        // className={blockStyles.blockContent}
        // data-content-type={blockConfig.type}
        {...htmlAttributes}>
        {/* @ts-ignore */}
        <MonacoElement {...restProps} ref={ref} />
      </NodeViewWrapper>
    );
  }
);

// TODO: clean up listeners
export const MonacoBlockContent = createTipTapBlock({
  name: "monaco",
  content: "inline*",
  editable: true,
  selectable: true,
  parseHTML() {
    return [
      {
        tag: "p",
        priority: 200,
        node: "paragraph",
      },
    ];
  },

  renderHTML({ HTMLAttributes }: any) {
    return [
      "code",
      mergeAttributes(HTMLAttributes, {
        // class: styles.blockContent,
        "data-content-type": this.name,
      }),
      ["p", 0],
    ];
  },

  addNodeView() {
    const BlockContent = React.forwardRef((props: any, ref) => {
      // const Content = blockConfig.render;

      // Add props as HTML attributes in kebab-case with "data-" prefix
      const htmlAttributes: Record<string, string> = {};
      for (const [attribute, value] of Object.entries(props.node.attrs)) {
        // if (attribute in blockConfig.propSchema) {
        //   htmlAttributes[camelToDataKebab(attribute)] = value;
        // }
      }

      // Gets BlockNote editor instance
      const editor = this.options.editor!;
      // Gets position of the node
      const pos =
        typeof props.getPos === "function" ? props.getPos() : undefined;
      // Gets TipTap editor instance
      const tipTapEditor = editor._tiptapEditor;
      // Gets parent blockContainer node
      const blockContainer = tipTapEditor.state.doc.resolve(pos!).node();
      // Gets block identifier
      const blockIdentifier = blockContainer.attrs.id;
      // Get the block
      const block = editor.getBlock(blockIdentifier)!;

      return (
        <ComponentWithWrapper
          htmlAttributes={htmlAttributes}
          block={block}
          editor={editor}
          {...props}
          ref={ref}
        />
      );
    });

    return (props) => {
      if (!(props.editor as any).contentComponent) {
        // same logic as in ReactNodeViewRenderer
        return {};
      }
      const ret = ReactNodeViewRenderer(BlockContent, {
        stopEvent: () => true,
      })(props) as NodeView;
      // manual hack, because tiptap React nodeviews don't support setSelection
      ret.setSelection = (anchor, head) => {
        // This doesn't work because the Tiptap react renderer doesn't properly support forwardref
        // (ret as any).renderer.ref?.setSelection(anchor, head);
        (ret as any).renderer.updateProps({
          selectionHack: { anchor, head },
        });
      };

      // This is a hack because tiptap doesn't support innerDeco, and this information is normally dropped
      const oldUpdated = ret.update!.bind(ret);
      ret.update = (node, outerDeco, innerDeco) => {
        const retAsAny = ret as any;
        let decorations = retAsAny.decorations;
        if (
          retAsAny.decorations.decorations !== outerDeco ||
          retAsAny.decorations.innerDecorations !== innerDeco
        ) {
          // change the format of "decorations" to have both the outerDeco and innerDeco
          decorations = {
            decorations: outerDeco,
            innerDecorations: innerDeco,
          };
        }
        return oldUpdated(node, decorations, undefined as any);
      };
      return ret;
    };
  },
  addProseMirrorPlugins() {
    return [arrowHandlers] as any;
  },
});
