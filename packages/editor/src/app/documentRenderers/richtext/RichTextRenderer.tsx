import { observer } from "mobx-react-lite";
import React, { useContext, useMemo } from "react";
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
import SourceModelCompiler from "../../../runtime/compiler/SourceModelCompiler";
import { MonacoContext } from "../../../runtime/editor/MonacoContext";
import { ExecutionHost } from "../../../runtime/executor/executionHosts/ExecutionHost";
import SandboxedExecutionHost from "../../../runtime/executor/executionHosts/sandboxed/SandboxedExecutionHost";
import { DocumentResource } from "../../../store/DocumentResource";
import { getStoreService } from "../../../store/local/stores";
import { MonacoBlockContent } from "./MonacoBlockContent";
import { RichTextContext } from "./RichTextContext";
import styles from "./RichTextRenderer.module.css";

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
  const monaco = useContext(MonacoContext).monaco;
  const tools = useMemo(() => {
    const newCompiler = new SourceModelCompiler(monaco);
    // if (!USE_SAFE_IFRAME) {
    //   throw new Error(
    //     "LocalExecutionHost disabled to prevent large bundle size"
    //   );
    //   // newExecutionHost = new LocalExecutionHost(props.document.id, newCompiler, monaco);
    // }
    const newExecutionHost: ExecutionHost = new SandboxedExecutionHost(
      props.document.id,
      newCompiler,
      monaco
    );
    return { newCompiler, newExecutionHost };
  }, []);

  const editor = useBlockNote({
    editorDOMAttributes: {
      class: styles.editor,
      "data-test": "editor",
    },
    blockSchema: {
      ...defaultBlockSchema,
      monaco: {
        propSchema: defaultProps,
        node: MonacoBlockContent,
      },
    },
    slashCommands: [
      ...(defaultReactSlashMenuItems as any),
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
  return (
    <div style={{ position: "relative" }}>
      {tools.newExecutionHost.renderContainer()}
      <RichTextContext.Provider
        value={{
          executionHost: tools.newExecutionHost,
          compiler: tools.newCompiler,
          document: props.document,
        }}>
        <BlockNoteView editor={editor} />
      </RichTextContext.Provider>
    </div>
  );
});

export default RichTextRenderer;
