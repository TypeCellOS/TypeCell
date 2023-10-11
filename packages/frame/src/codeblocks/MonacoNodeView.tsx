/* eslint-disable @typescript-eslint/no-explicit-any */
// import styles from "../../Block.module.css";

import { BlockNoteEditor } from "@blocknote/core";
import {
  NodeViewProps,
  NodeViewRenderer,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { uniqueId } from "@typecell-org/util";
import { NodeView } from "prosemirror-view";
import { useContext, useRef } from "react";
import { uri } from "vscode-lib";
import { RichTextContext } from "../RichTextContext";
import { MonacoElement, MonacoElementProps } from "./MonacoElement";
import { getBlockInfoFromPos } from "./blocknotehelpers";

const ComponentWithWrapper = (
  props: { htmlAttributes: any } & MonacoElementProps,
) => {
  const { htmlAttributes, ...restProps } = props;
  return (
    <NodeViewWrapper
      as={props.inline ? "span" : "div"}
      // className={blockStyles.blockContent}
      // data-content-type={blockConfig.type}
      {...htmlAttributes}>
      <MonacoElement {...restProps} />
    </NodeViewWrapper>
  );
};

export function MonacoNodeView(inline: boolean) {
  const nodeView:
    | ((this: {
        name: string;
        options: any;
        storage: any;
        editor: any;
        type: any;
        parent: any;
      }) => NodeViewRenderer)
    | null = function () {
    const BlockContent = (props: NodeViewProps & { selectionHack: any }) => {
      const id = useRef(uniqueId.generateUuid());
      const context = useContext(RichTextContext);
      const htmlAttributes: Record<string, string> = {};

      // Gets BlockNote editor instance
      const editor: BlockNoteEditor<any> = this.options.editor;
      // Gets position of the node
      const pos =
        typeof props.getPos === "function" ? props.getPos() : undefined;

      if (!pos) {
        return null;
      }

      const tipTapEditor = editor._tiptapEditor;
      // Gets parent blockContainer node
      const blockContainer = getBlockInfoFromPos(tipTapEditor.state.doc, pos);
      // Gets block identifier
      const blockIdentifier = blockContainer.node.attrs.id;
      // Get the block
      const block = editor.getBlock(blockIdentifier);

      if (!block) {
        return null;
      }

      const suffix = inline ? "_" + id.current : "";
      const modelUri = uri.URI.parse(
        `file:///!${context.documentId}/${block.id}${suffix}.cell.tsx`,
      );

      return (
        <ComponentWithWrapper
          htmlAttributes={htmlAttributes}
          // blockNoteEditor={this.options.editor}
          inline={inline}
          modelUri={modelUri}
          language={props.node.attrs.language || "typescript"}
          setLanguage={(language) => {
            editor.updateBlock(block, {
              props: {
                language,
              },
            });
          }}
          {...props}
          // ref={ref}
        />
      );
    };
    // console.log("addnodeview");
    return (props) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ret as any).renderer.updateProps({
          selectionHack: { anchor, head },
        });
      };

      // disable contentdom, because we render the content ourselves in MonacoElement
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ret as any).contentDOMElement = undefined;
      // ret.destroy = () => {
      //   console.log("destroy element");
      //   // (ret as any).renderer.destroy();
      // };
      // This is a hack because tiptap doesn't support innerDeco, and this information is normally dropped
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const oldUpdated = ret.update!.bind(ret);
      ret.update = (node, outerDeco, innerDeco) => {
        // console.log("update");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return oldUpdated(node, decorations, undefined as any);
      };
      return ret;
    };
  };
  return nodeView;
}
