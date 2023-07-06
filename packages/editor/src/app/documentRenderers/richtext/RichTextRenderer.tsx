import { autorun } from "mobx";
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
import { Block } from "../../../runtime/executor/lib/exports";
import { DocumentResource } from "../../../store/DocumentResource";
import { SessionStore } from "../../../store/local/SessionStore";
import { MonacoColorManager } from "../notebook/MonacoColorManager";
import { CustomDragHandleMenu } from "./CustomDragHandleMenu";
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

const baseSlashCommands = [
  ...defaultReactSlashMenuItems,
  new BaseSlashMenuItem(
    "Monaco",
    (editor: any) =>
      insertOrUpdateBlock(editor, {
        type: "codeNode",
      } as any),
    ["m"]
  ),
  new BaseSlashMenuItem(
    "Inline",
    (editor) => {
      // state.tr.replaceSelectionWith(dinoType.create({type}))
      const node = editor._tiptapEditor.schema.node(
        "inlineCode",
        undefined,
        editor._tiptapEditor.schema.text("export default ")!
      );
      const tr = editor._tiptapEditor.state.tr.replaceSelectionWith(node);
      // TODO: set selection at end of ""export default " and open inline node
      editor._tiptapEditor.view.dispatch(tr);
    },
    // insertOrUpdateBlock(editor, {
    //   type: "abc",
    // } as any),
    ["m"]
  ),
];

const slashCommands = [...baseSlashCommands];

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
      sessionStore,
      (obj) => console.log("loadPlugins", obj)
    );

    console.log("context", newExecutionHost.engine.observableContext.context);
    autorun(() => {
      const customSlashCommands: any[] = [];
      for (let [_key, val] of Object.entries(
        newExecutionHost.engine.observableContext.context
      )) {
        if (typeof val === "object" && (val as any)?.__moduleName) {
          const moduleName = (val as any)?.__moduleName;
          for (let [key, obj] of Object.entries(val as any)) {
            if (obj instanceof Block) {
              console.log("blockcomp", key, val);
              customSlashCommands.push(
                new BaseSlashMenuItem(obj.name, (editor) => {
                  insertOrUpdateBlock(
                    editor as any,
                    {
                      type: "codeNode",
                      props: {
                        language: "typescript",
                        moduleName: moduleName,
                        key,
                        bindings: "",
                      },
                      content: `// @default-collapsed
import * as doc from "${moduleName}";

export default {
block: doc.${key},
doc,
};`,
                    } as any
                  );
                })
              );
            }
          }
        }
      }
      slashCommands.splice(
        baseSlashCommands.length,
        slashCommands.length - baseSlashCommands.length,
        ...customSlashCommands
      );
    });
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
    customElements: {
      dragHandleMenu: CustomDragHandleMenu,
    },
    blockSchema: {
      ...defaultBlockSchema,
      codeNode: {
        propSchema: {
          language: {
            type: "string",
            default: "typescript",
          },
          moduleName: {
            type: "string",
            default: "",
          },
          key: {
            type: "string",
            default: "",
          },
          bindings: {
            type: "string",
            default: "",
          },
        },
        node: MonacoBlockContent,
      },
      inlineCode: {
        propSchema: {
          language: {
            type: "string",
            default: "typescript",
          },
        },
        node: InlineMonacoContent,
      },
    } as any,
    slashCommands,
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
