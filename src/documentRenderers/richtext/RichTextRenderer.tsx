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
import { start } from "repl";
import "./MultiSelection";
import { MultiSelection } from "./MultiSelection";

type Props = {
  document: DocumentResource;
};
const RichTextRenderer: React.FC<Props> = (props) => {
  const editor = useEditor({
    onUpdate: ({ editor }) => {
      // console.log(editor.getJSON());
      editor.state.doc.resolve(editor.state.selection.from).node();
    },
    onSelectionUpdate: ({ editor }) => {
      // Updates styling for multi block selection.
      editor.state.doc.descendants(function (node, pos) {
        let element = editor.view.domAtPos(pos + 1).node.parentElement!;
        if (!node.attrs["block-selected"] && element.className === "selected") {
          element.className = "";
        } else if (node.attrs["block-selected"] && element.className === "") {
          element.className = "selected";
        }
      });
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
      MultiSelection,

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
