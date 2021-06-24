import Bold from "@tiptap/extension-bold";
import Code from "@tiptap/extension-code";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Italic from "@tiptap/extension-italic";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditor, EditorContent } from "@tiptap/react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef } from "react";
import Strike from "@tiptap/extension-strike";
import Link from "@tiptap/extension-link";
import Text from "@tiptap/extension-text";
import { DocumentResource } from "../../store/DocumentResource";
import { AutoId } from "./extensions/autoid/AutoId";
import { MultiSelection } from "./extensions/multiselection/MultiSelection";
import { TrailingNode } from "./extensions/trailingnode";
import {
  BlockQuoteBlock,
  HeadingBlock,
  HorizontalRuleBlock,
  IndentItemBlock,
  ListItemBlock,
  ParagraphBlock,
  TypeCellNodeBlock,
  BulletList,
  OrderedList,
  CodeBlockBlock,
} from "./extensions/blocktypes";
import { TableBlock } from "./extensions/blocktypes/TableBlock";
import ImageBlock from "./extensions/blocktypes/ImageBlock";
import IndentGroup from "./extensions/blocktypes/IndentGroup";
import { Underline } from "./extensions/marks/Underline";
import { Mention, MentionType } from "./extensions/mentions";
import MentionsExtension from "./extensions/mentions";
import { Comment } from "./extensions/marks/Comment";
import SlashCommandExtension from "./extensions/slashcommand";
import "./RichTextRenderer.css";
import EngineWithOutput from "../../typecellEngine/EngineWithOutput";
import { EngineContext } from "./extensions/typecellnode/EngineContext";
import InlineMenu from "./menus/InlineMenu";
import TableMenu from "./menus/TableInlineMenu";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { Comments } from "./extensions/comments/Comments";
import { CommentStore } from "./extensions/comments/CommentStore";
import { CommentWrapper } from "./extensions/comments/CommentWrapper";
import Hyperlink from "./extensions/marks/Hyperlink";

// This is a temporary array to show off mentions
const PEOPLE = [
  new Mention("Pepijn Vunderink", MentionType.PEOPLE),
  new Mention("Yousef El-Dardiri", MentionType.PEOPLE),
  new Mention("Chong Zhao", MentionType.PEOPLE),
  new Mention("Matthew Lipski", MentionType.PEOPLE),
  new Mention("Emre Agca", MentionType.PEOPLE),
  new Mention("Nikolay Zhlebinkov", MentionType.PEOPLE),
];

type Props = {
  document: DocumentResource;
};

const RichTextRenderer: React.FC<Props> = observer((props: Props) => {
  const commentStore = new CommentStore(props.document.comments);
  const disposer = useRef<() => void>();

  const engine = useMemo(() => {
    if (disposer.current) {
      disposer.current();
      disposer.current = undefined;
    }
    const newEngine = new EngineWithOutput(props.document.id, true);
    disposer.current = () => {
      newEngine.dispose();
    };

    return newEngine;
  }, [props.document.id]);

  useEffect(() => {
    return () => {
      if (disposer.current) {
        disposer.current();
        disposer.current = undefined;
      }
    };
  }, []);

  const editor = useEditor({
    extensions: [
      CollaborationCursor.configure({
        provider: props.document.webrtcProvider,
        user: { name: "Hello", color: "#f783ac" },
      }),
      Collaboration.configure({
        fragment: props.document.data,
      }),
      // DropCursor,
      // Even though we implement our own placeholder logic in Blocks, we
      // still need the placeholder extension to make sure nodeviews
      // are re-rendered when they're empty or when the anchor changes.
      Placeholder.configure({
        placeholder: "", // actual placeholders are defined per block
        showOnlyCurrent: true, // use showOnlyCurrent to make sure the nodeviews are rerendered when cursor moves
      }),
      AutoId,
      HardBreak,
      Comments,
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
      Comment,
      Hyperlink,

      // custom blocks:
      ImageBlock,
      BlockQuoteBlock.configure({ placeholder: "Empty quote" }),
      CodeBlockBlock,
      HeadingBlock.configure({ placeholder: "Heading" }),
      HorizontalRuleBlock,
      ParagraphBlock.configure({
        placeholder: "Enter text or type '/' for commands",
        placeholderOnlyWhenSelected: true,
      }),
      ListItemBlock.configure({
        placeholder: "List item",
        HTMLAttributes: {
          "data-cy": "list-item-block",
        },
      }),
      TableBlock,
      IndentItemBlock.configure({
        HTMLAttributes: {
          class: "indent",
        },
      }),
      BulletList,
      OrderedList,

      // custom containers:
      IndentGroup,

      // from tiptap (unmodified)
      TableCell,
      TableHeader,
      TableRow,
      TypeCellNodeBlock,

      // This needs to be at the bottom of this list, because Key events (such as enter, when selecting a /command),
      // should be handled before Enter handlers in other components like splitListItem
      SlashCommandExtension.configure({
        // Extra commands can be registered here
        commands: {},
      }),
      MentionsExtension.configure({
        providers: {
          people: (query) => {
            return PEOPLE.filter((mention) => mention.match(query));
          },
        },
      }),
      TrailingNode,
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
      {editor != null ? (
        <InlineMenu editor={editor} commentStore={commentStore} />
      ) : null}
      {editor != null ? <TableMenu editor={editor} /> : null}
      {editor != null ? (
        <CommentWrapper editor={editor} commentStore={commentStore} />
      ) : null}
      <EngineContext.Provider value={{ engine, document: props.document }}>
        <EditorContent editor={editor} />
      </EngineContext.Provider>
    </div>
  );
});

export default RichTextRenderer;
