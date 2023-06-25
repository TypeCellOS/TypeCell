import { observer } from "mobx-react-lite";
import React, { useContext, useEffect, useMemo } from "react";
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import {
  BaseSlashMenuItem,
  BlockNoteEditor,
  DefaultBlockSchema,
  PartialBlock,
  defaultBlockSchema,
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
import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost";
import { DocumentResource } from "../../../store/DocumentResource";
import { SessionStore } from "../../../store/local/SessionStore";
import { MonacoColorManager } from "../notebook/MonacoColorManager";
import { InlineMonacoContent } from "./InlineMonacoContent";
import { MonacoBlockContent } from "./MonacoBlockContent";
import { RichTextContext } from "./RichTextContext";
import styles from "./RichTextRenderer.module.css";

type Props = {
  document: DocumentResource;
  sessionStore: SessionStore;
};
window.React = React;
window.ReactDOM = ReactDOM;

class FakeProvider {
  constructor(public readonly awareness: any) {}
}
function insertOrUpdateBlock<BSchema extends DefaultBlockSchema>(
  editor: BlockNoteEditor<BSchema>,
  block: PartialBlock<BSchema>
) {
  const currentBlock = editor.getTextCursorPosition()!.block;

  if (
    (currentBlock.content.length === 1 &&
      currentBlock.content[0].type === "text" &&
      currentBlock.content[0].text === "/") ||
    currentBlock.content.length === 0
  ) {
    editor.updateBlock(currentBlock, block);
  } else {
    editor.insertBlocks([block], currentBlock, "after");
    editor.setTextCursorPosition(editor.getTextCursorPosition()!.nextBlock!);
  }
}

const RichTextRenderer: React.FC<Props> = observer((props) => {
  const { sessionStore } = props;
  const monaco = useContext(MonacoContext).monaco;
  const tools = useMemo(() => {
    const newCompiler = new SourceModelCompiler(monaco);
    // if (!USE_SAFE_IFRAME) {
    //   throw new Error(
    //     "LocalExecutionHost disabled to prevent large bundle size"
    //   );
    //   // newExecutionHost = new LocalExecutionHost(props.document.id, newCompiler, monaco);
    // }
    const newExecutionHost: LocalExecutionHost = new LocalExecutionHost(
      props.document.id,
      newCompiler,
      monaco,
      sessionStore
    );

    // const newExecutionHost: ExecutionHost = new SandboxedExecutionHost(
    //   props.document.id,
    //   newCompiler,
    //   monaco
    // );
    return { newCompiler, newExecutionHost };
  }, []);

  useEffect(() => {
    // make sure color info is broadcast, and color info from other users are reflected in monaco editor styles
    if (props.document.awareness) {
      const colorManager = new MonacoColorManager(
        props.document.awareness,
        sessionStore.loggedInUserId || "Anonymous",
        sessionStore.userColor
      );
      return () => {
        colorManager.dispose();
      };
    }
  }, [
    props.document.awareness,
    sessionStore.loggedInUserId,
    sessionStore.userColor,
  ]);

  const editor = useBlockNote({
    editorDOMAttributes: {
      class: styles.editor,
      "data-test": "editor",
    },
    blockSchema: {
      ...defaultBlockSchema,
      monaco: {
        propSchema: {
          language: {
            type: "string",
            default: "typescript",
          },
        },
        node: MonacoBlockContent,
      },
      abc: {
        propSchema: {
          language: {
            type: "string",
            default: "typescript",
          },
        },
        node: InlineMonacoContent,
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
      new BaseSlashMenuItem(
        "Inline",
        (editor) => {
          // state.tr.replaceSelectionWith(dinoType.create({type}))
          const node = editor._tiptapEditor.schema.node("abc");
          const tr = editor._tiptapEditor.state.tr.replaceSelectionWith(node);
          editor._tiptapEditor.view.dispatch(tr);
        },
        // insertOrUpdateBlock(editor, {
        //   type: "abc",
        // } as any),
        ["m"]
      ),
    ],
    collaboration: {
      provider: new FakeProvider(props.document.awareness),
      user: {
        name: sessionStore.loggedInUserId || "Anonymous",
        color: sessionStore.userColor,
      },
      fragment: props.document.data as any,
    },
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
