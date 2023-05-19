import { observer } from "mobx-react-lite";
import React from "react";
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import {
  BaseSlashMenuItem,
  BlockNoteEditor,
  DefaultBlockSchema,
  PartialBlock,
  defaultBlockSchema,
  defaultProps,
} from "@blocknote/core";
import "@blocknote/core/style.css";
import {
  BlockNoteView,
  defaultReactSlashMenuItems,
  useBlockNote,
} from "@blocknote/react";
import ReactDOM from "react-dom";
import { DocumentResource } from "../../../store/DocumentResource";
import { getStoreService } from "../../../store/local/stores";
import { MonacoBlockContent } from "./MonacoBlockContent";

type Props = {
  document: DocumentResource;
};
window.React = React;
window.ReactDOM = ReactDOM;

function insertOrUpdateBlock<BSchema extends DefaultBlockSchema>(
  editor: BlockNoteEditor<BSchema>,
  block: PartialBlock<BSchema>
) {
  const currentBlock = editor.getTextCursorPosition().block;

  if (
    (currentBlock.content.length === 1 &&
      currentBlock.content[0].type === "text" &&
      currentBlock.content[0].text === "/") ||
    currentBlock.content.length === 0
  ) {
    editor.updateBlock(currentBlock, block);
  } else {
    editor.insertBlocks([block], currentBlock, "after");
    editor.setTextCursorPosition(editor.getTextCursorPosition().nextBlock!);
  }
}

const RichTextRenderer: React.FC<Props> = observer((props) => {
  const sessionStore = getStoreService().sessionStore;

  const editor = useBlockNote({
    blockSchema: {
      ...defaultBlockSchema,
      monaco: {
        propSchema: defaultProps,
        node: MonacoBlockContent,
      },
    },
    slashCommands: [
      ...(defaultReactSlashMenuItems() as any),
      new BaseSlashMenuItem(
        "Monaco",
        (editor: any) =>
          insertOrUpdateBlock(editor, {
            type: "monaco",
          } as any),
        ["m"]
      ),
    ],
    // onUpdate: ({ editor }) => {
    //   console.log(editor.getJSON());
    // },
    // editorProps: {
    //   attributes: {
    //     class: styles.editor,
    //     "data-test": "editor",
    //   },
    // },
    // disableHistoryExtension: true,
    // extensions: [
    //   CollaborationCursor.configure({
    //     provider: {
    //       awareness: props.document.awareness,
    //     },
    //     user: {
    //       name: sessionStore.loggedInUserId || "Anonymous",
    //       color: sessionStore.userColor,
    //     },
    //   }),
    //   Collaboration.configure({
    //     fragment: props.document.data,
    //   }),
    // ],
  });
  return <BlockNoteView editor={editor} />;
});

export default RichTextRenderer;
