import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Italic from "@tiptap/extension-italic";
import OrderedList from "@tiptap/extension-ordered-list";
import Placeholder from "@tiptap/extension-placeholder";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import { EditorContent, getNodeType, useEditor } from "@tiptap/react";
import React from "react";
import { DocumentResource } from "../../store/DocumentResource";
import { AutoId } from "./extensions/autoid/AutoId";
import {
  BlockQuoteBlock,
  CodeBlockBlock,
  HeadingBlock,
  HorizontalRuleBlock,
  IndentItemBlock,
  ListItemBlock,
  ParagraphBlock,
} from "./extensions/blocktypes";
import ImageBlock from "./extensions/blocktypes/ImageBlock";
import IndentGroup from "./extensions/blocktypes/IndentGroup";
import { Underline } from "./extensions/marks/Underline";
import SlashCommandExtension from "./extensions/slashcommand";
import InlineMenu from "./InlineMenu";
import MultiNodeSelection from "./MultiNodeSelection";
import { findParentNode, mergeAttributes, Node } from "@tiptap/core";
import "./RichTextRenderer.css";

import { Selection, NodeSelection, TextSelection } from "prosemirror-state";
import { NodeRange } from "prosemirror-model";
import { findWrapping } from "prosemirror-transform";
import { isList } from "./util/isList";

type Props = {
  document: DocumentResource;
};
const RichTextRenderer: React.FC<Props> = (props) => {
  let selectedIds: Array<number> = [];

  const editor = useEditor({
    onUpdate: ({ editor }) => {
      // console.log(editor.getJSON());
      editor.state.doc.resolve(editor.state.selection.from).node();
    },
    onSelectionUpdate: ({ editor }) => {
      // Clears previous selection.
      selectedIds = [];
      editor.state.doc.descendants(function (node, pos, parent) {
        let element = editor.view.domAtPos(pos + 1).node.parentElement!;
        if (element.className === "selected") {
          console.log(element);
          element.className = "";
        }
      });

      const range = new NodeRange(
        editor.state.selection.$from,
        editor.state.selection.$to,
        0
      );

      if (range.endIndex - range.startIndex > 1) {
        editor.state.doc.nodesBetween(
          range.start,
          range.end,
          function (node, pos) {
            if (node.attrs["block-id"]) {
              selectedIds.push(node.attrs["block-id"]);
              editor.view.domAtPos(pos + 1).node.parentElement!.className =
                "selected";

              return false;
            }
          }
        );

        const tr = editor.state.tr.setSelection(
          TextSelection.create(editor.state.doc, range.start, range.end)
        );

        editor.view.dispatch(tr);
      }
    },
    extensions: [
      CollaborationCursor.configure({
        provider: props.document.webrtcProvider,
        user: { name: "Hello", color: "#f783ac" },
      }),
      Collaboration.configure({
        fragment: props.document.data,
      }),
      // DropCursor,
      Placeholder.configure({
        placeholder: "Use '/' to insert a new block.",
        showOnlyCurrent: false,
      }),
      AutoId,
      HardBreak,

      // basics:
      Text,
      Document,

      // marks:
      Bold,
      Code,
      Italic,
      Strike,
      Underline,

      // custom blocks:
      ImageBlock,
      BlockQuoteBlock,
      CodeBlockBlock,
      HeadingBlock,
      HorizontalRuleBlock,
      ParagraphBlock,
      ListItemBlock,
      IndentItemBlock.configure({
        HTMLAttributes: {
          className: "indent",
        },
      }),

      // custom containers:
      IndentGroup,

      // from tiptap (unmodified)
      BulletList,
      OrderedList,

      // This needs to be at the bottom of this list, because Key events (such as enter, when selecting a /command),
      // should be handled before Enter handlers in other components like splitListItem
      SlashCommandExtension.configure({
        commands: {},
      }),
      // TypeCellNode,
    ],
    enableInputRules: true,
    enablePasteRules: true,
    editorProps: {
      attributes: {
        class: "editor",
      },
    },
  });

  return (
    <div>
      {/*{editor != null ? <InlineMenu editor={editor} /> : null}*/}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextRenderer;
