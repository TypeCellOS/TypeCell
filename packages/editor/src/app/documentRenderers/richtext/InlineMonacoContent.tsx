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
import { MonacoElement } from "./MonacoElement";

function arrowHandler(
  dir: "up" | "down" | "left" | "right" | "forward" | "backward"
) {
  return (state: EditorState, dispatch: any, view: EditorView) => {
    if (state.selection.empty) {
      let side = dir === "left" || dir === "up" ? -1 : 1;
      let $head = state.selection.$head;

      let nextPos = Selection.near(
        state.doc.resolve(side > 0 ? $head.pos + 1 : $head.pos - 1),
        side
      );

      if (nextPos.$head && nextPos.$head.parent.type.name === "inlineCode") {
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

const ComponentWithWrapper = (
  props: NodeViewProps & { block: any; htmlAttributes: any }
) => {
  const { htmlAttributes, ...restProps } = props;
  return (
    <NodeViewWrapper
      as="span"
      // className={blockStyles.blockContent}
      // data-content-type={blockConfig.type}
      {...htmlAttributes}>
      {/* @ts-ignore */}
      <MonacoElement inline={true} {...restProps} />
    </NodeViewWrapper>
  );
};

// TODO: clean up listeners
export const InlineMonacoContent = createTipTapBlock({
  name: "inlineCode",
  // inline: true,
  content: "inline*",
  editable: true,
  selectable: false,
  parseHTML() {
    return [
      {
        tag: "code",
        priority: 200,
        node: "code",
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
      ["code", 0],
    ];
  },

  addNodeView() {
    const BlockContent = (props: any) => {
      // const Content = blockConfig.render;

      // Add props as HTML attributes in kebab-case with "data-" prefix
      const htmlAttributes: Record<string, string> = {};
      // for (const [attribute, value] of Object.entries(props.node.attrs)) {
      // if (attribute in blockConfig.propSchema) {
      //   htmlAttributes[camelToDataKebab(attribute)] = value;
      // }
      // }

      // Gets BlockNote editor instance
      const editor = this.options.editor!;
      // Gets position of the node
      const pos =
        typeof props.getPos === "function" ? props.getPos() : undefined;
      // Gets TipTap editor instance
      const tipTapEditor = editor._tiptapEditor;
      // Gets parent blockContainer node
      // const blockContainer = tipTapEditor.state.doc.resolve(pos!).node();
      // // Gets block identifier
      // const blockIdentifier = blockContainer.attrs.id;
      // // Get the block
      // const block = editor.getBlock(blockIdentifier)!;

      console.log("ComponentWithWrapper");
      return (
        <ComponentWithWrapper
          htmlAttributes={htmlAttributes}
          block={undefined}
          editor={editor}
          {...props}
          // ref={ref}
        />
      );
    };

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

      // disable contentdom, because we render the content ourselves in MonacoElement
      // TODO: set contentDOM to undefined, but this causes a bug in PM
      (ret as any).contentDOMElement = undefined;

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

InlineMonacoContent.config.group = "inline" as any;
(InlineMonacoContent as any).config.inline = true as any;
