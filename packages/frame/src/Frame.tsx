import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef } from "react";
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import {
  BlockNoteEditor,
  DefaultBlockSchema,
  PartialBlock,
  defaultBlockSchema,
} from "@blocknote/core";
import "@blocknote/core/style.css";
import {
  BlockNoteView,
  getDefaultReactSlashMenuItems,
  useBlockNote,
} from "@blocknote/react";
import { enableMobxBindings } from "@syncedstore/yjs-reactive-bindings";
import { ReactiveEngine } from "@typecell-org/engine";
import {
  BasicCodeModel,
  HostBridgeMethods,
  IframeBridgeMethods,
  ModelReceiver,
} from "@typecell-org/shared";
import { useResource } from "@typecell-org/util";
import { PenPalProvider } from "@typecell-org/y-penpal";
import * as mobx from "mobx";
import * as monaco from "monaco-editor";
import { AsyncMethodReturns, connectToParent } from "penpal";
import ReactDOM from "react-dom";
import * as Y from "yjs";
import styles from "./Frame.module.css";
import { RichTextContext } from "./RichTextContext";
import { MonacoCodeBlock } from "./codeblocks/MonacoCodeBlock";
import SourceModelCompiler from "./runtime/compiler/SourceModelCompiler";
import { setMonacoDefaults } from "./runtime/editor";
import { MonacoContext } from "./runtime/editor/MonacoContext";
import LocalExecutionHost from "./runtime/executor/executionHosts/local/LocalExecutionHost";

import { variables } from "@typecell-org/util";
import { RiCodeSSlashFill } from "react-icons/ri";
import { VscWand } from "react-icons/vsc";
import { EditorStore } from "./EditorStore";
import { MonacoColorManager } from "./MonacoColorManager";

import { getAICode } from "./ai/ai";
import { applyChanges } from "./ai/applyChanges";
import { MonacoInlineCode } from "./codeblocks/MonacoInlineCode";
import monacoStyles from "./codeblocks/MonacoSelection.module.css";
import { setupTypecellHelperTypeResolver } from "./runtime/editor/languages/typescript/TypeCellHelperTypeResolver";
import { setupTypecellModuleTypeResolver } from "./runtime/editor/languages/typescript/TypeCellModuleTypeResolver";
import { setupNpmTypeResolver } from "./runtime/editor/languages/typescript/npmTypeResolver";
import { Resolver } from "./runtime/executor/resolver/resolver";

enableMobxBindings(mobx);

window.React = React;
window.ReactDOM = ReactDOM;

setMonacoDefaults(monaco);
setupTypecellHelperTypeResolver(monaco);
setupTypecellModuleTypeResolver(monaco);
setupNpmTypeResolver(monaco);

class FakeProvider {
  constructor(public readonly awareness: unknown) {}
}

function insertOrUpdateBlock<BSchema extends DefaultBlockSchema>(
  editor: BlockNoteEditor<BSchema>,
  block: PartialBlock<BSchema>,
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editor.setTextCursorPosition(editor.getTextCursorPosition().nextBlock!);
  }
}

type Props = {
  documentIdString: string;
  roomName: string;
  userName: string;
  userColor: string;
};

const originalItems = [
  ...getDefaultReactSlashMenuItems(),
  {
    name: "Code block",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: (editor: BlockNoteEditor<any>) =>
      insertOrUpdateBlock(editor, {
        type: "codeblock",
      }),
    aliases: ["code"],
    hint: "Add a live code block",
    group: "Code",
    icon: <RiCodeSSlashFill size={18} />,
  },
  {
    name: "Inline",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: (editor: BlockNoteEditor<any>) => {
      // state.tr.replaceSelectionWith(dinoType.create({type}))
      const node = editor._tiptapEditor.schema.node(
        "inlineCode",
        undefined,
        editor._tiptapEditor.schema.text("export default "),
      );
      const tr = editor._tiptapEditor.state.tr.replaceSelectionWith(node);
      editor._tiptapEditor.view.dispatch(tr);
    },
  },
];
const slashMenuItems = [...originalItems];

export const Frame: React.FC<Props> = observer((props) => {
  const modelReceivers = useMemo(() => new Map<string, ModelReceiver>(), []);
  const subCompilers = useMemo(
    () => new Map<string, SourceModelCompiler>(),
    [],
  );
  const connectionMethods = useRef<AsyncMethodReturns<HostBridgeMethods>>();
  const editorStore = useRef(new EditorStore());

  const document = useResource(() => {
    const ydoc = new Y.Doc();
    // ydoc.on("update", () => {
    //   console.log("frame ydoc", ydoc.toJSON());
    // });
    const provider = new PenPalProvider(
      ydoc,
      (buf, _provider) => {
        connectionMethods.current?.processYjsMessage(buf);
      },
      undefined,
      false,
    );

    const colorManager = new MonacoColorManager(
      provider.awareness,
      props.userName,
      props.userColor,
      monacoStyles.yRemoteSelectionHead,
      monacoStyles.yRemoteSelection,
    );

    return [
      {
        provider,
        awareness: provider.awareness,
        ydoc,
      },
      () => {
        provider.destroy();
        colorManager.dispose();
      },
    ];
  }, []);

  useEffect(() => {
    const methods: IframeBridgeMethods = {
      processYjsMessage: async (message: ArrayBuffer) => {
        document.provider.onMessage(message, "penpal");
      },
      updateModels: async (
        bridgeId: string,
        models: {
          modelId: string;
          model: { value: string; language: string };
        }[],
      ) => {
        for (const model of models) {
          await methods.updateModel(bridgeId, model.modelId, model.model);
        }
      },
      updateModel: async (
        bridgeId: string,
        modelId: string,
        model: { value: string; language: string },
      ) => {
        console.log("register model", modelId);
        const modelReceiver = modelReceivers.get(bridgeId);
        if (modelReceiver) {
          modelReceiver.updateModel(modelId, model);
        } else {
          throw new Error("unknown bridgeId");
        }
      },

      deleteModel: async (bridgeId: string, modelId: string) => {
        const modelReceiver = modelReceivers.get(bridgeId);
        if (modelReceiver) {
          modelReceiver.deleteModel(modelId);
        } else {
          throw new Error("unknown bridgeId");
        }
      },
      ping: function (): Promise<"pong"> {
        throw new Error("Function not implemented.");
      },
    };
    const connection = connectToParent<HostBridgeMethods>({
      // Methods child is exposing to parent
      methods,
    });
    console.info("iframe connecting to parent window");
    connection.promise.then(
      (parent) => {
        console.info("connected to parent window succesfully");
        connectionMethods.current = parent;
        document.provider.connect();
      },
      (e) => {
        console.error("connection to parent window failed", e);
      },
    );
  }, [modelReceivers, document]);

  const tools = useResource(
    // "compilers",
    () => {
      const newCompiler = new SourceModelCompiler(monaco);
      const resolver = new Resolver(async (moduleName) => {
        // How to resolve typecell modules (i.e.: `import * as nb from "!dALYTUW8TXxsw"`)

        const fullIdentifier =
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          await connectionMethods.current!.resolveModuleName(moduleName);

        if ("!" + fullIdentifier !== moduleName) {
          // register an alias for the module so that types resolve
          // (e.g.: from "!dALYTUW8TXxsw" to "!typecell:typecell.org/dALYTUW8TXxsw")

          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            `export * from "!${fullIdentifier}";`,
            `file:///node_modules/@types/${moduleName}/index.d.ts`,
          );
        }

        let modelReceiver = modelReceivers.get("modules/" + fullIdentifier);

        if (modelReceiver) {
          const subCompiler = subCompilers.get("modules/" + fullIdentifier);
          if (!subCompiler) {
            throw new Error("subCompiler not found");
          }
          return subCompiler;
        }
        modelReceiver = new ModelReceiver();

        modelReceivers.set("modules/" + fullIdentifier, modelReceiver);

        const subcompiler = new SourceModelCompiler(monaco);
        modelReceiver.onDidCreateModel((model) => {
          subcompiler.registerModel(model);
        });

        subCompilers.set("modules/" + fullIdentifier, subcompiler);

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await connectionMethods.current!.registerTypeCellModuleCompiler(
          fullIdentifier,
        );
        // TODO: dispose modelReceiver
        return subcompiler;
      }, editorStore.current);
      const newEngine = new ReactiveEngine<BasicCodeModel>(
        resolver.resolveImport,
      );

      const newExecutionHost = new LocalExecutionHost(
        props.documentIdString,
        newCompiler,
        monaco,
        newEngine,
      );

      return [
        { newCompiler, newExecutionHost },
        () => {
          newCompiler.dispose();
        },
      ];
    },
    [props.documentIdString, monaco],
  );

  slashMenuItems.splice(
    originalItems.length,
    slashMenuItems.length,
    {
      name: "AI",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      execute: async (editor: BlockNoteEditor<any>) => {
        const p = prompt("What would you like TypeCell AI to do?");
        if (!p) {
          return;
        }

        const commands = await getAICode(
          p,
          props.documentIdString,
          tools.newExecutionHost,
          editor,
          editorStore.current,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          connectionMethods.current!.queryLLM,
        );

        // TODO: we should validate the commands before applying them
        applyChanges(
          commands,
          document.ydoc.getXmlFragment("doc"),
          document.awareness,
        );
      },
      aliases: ["ai", "wizard", "openai", "llm"],
      hint: "Prompt your TypeCell AI assistant",
      group: "Code",
      icon: <VscWand size={18} />,
    },
    ...[...editorStore.current.customBlocks.values()].map((data) => {
      console.log("update blocks");
      return {
        name: data.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (editor: BlockNoteEditor<any>) => {
          const origVarName = variables.toCamelCaseVariableName(data.name);
          let varName = origVarName;
          let i = 0;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            // append _1, _2, _3, ... to the variable name until it is unique

            const context =
              tools.newExecutionHost.engine.observableContext.rawContext;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((context as any)[varName] === undefined) {
              break;
            }
            i++;
            varName = origVarName + "_" + i;
          }

          const settingsPart = data.settings
            ? `
typecell.editor.registerBlockSettings({
  content: (visible: boolean) => (
    <typecell.AutoForm
      inputObject={doc}
      fields={${JSON.stringify(data.settings, undefined, 2)}}
      visible={visible}
    />
  ),
});
`
            : "";
          insertOrUpdateBlock(editor, {
            type: "codeblock",
            props: {
              language: "typescript",
              storage: "",
            },
            content: `// @default-collapsed
import * as doc from "${data.documentId}";

export let ${varName} = doc.${data.blockExport};
export let ${varName}Scope = doc;
${settingsPart}
export default ${varName};
`,
          });
        },
        group: "Custom",
      };
    }),
  );

  const editor = useBlockNote({
    defaultStyles: false,
    domAttributes: {
      editor: {
        class: styles.editor + " markdown-body",
        "data-test": "editor",
      },
    },
    blockSchema: {
      ...defaultBlockSchema,
      codeblock: {
        propSchema: {
          language: {
            type: "string",
            default: "typescript",
          },
          storage: {
            type: "string",
            default: "",
          },
        },
        node: MonacoCodeBlock,
      },
      inlinecode: {
        propSchema: {
          language: {
            type: "string",
            default: "typescript",
          },
          storage: {
            type: "string",
            default: "",
          },
        },
        node: MonacoInlineCode,
      },
    },
    slashMenuItems,
    collaboration: {
      provider: new FakeProvider(document.awareness),
      user: {
        name: props.userName,
        color: props.userColor,
      },
      fragment: document.ydoc.getXmlFragment("doc"),
    },
  });

  if (editorStore.current.editor !== editor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editorStore.current.editor = editor as any;
  }

  if (editorStore.current.executionHost !== tools.newExecutionHost) {
    editorStore.current.executionHost = tools.newExecutionHost;
  }

  return (
    <div className={styles.container}>
      <MonacoContext.Provider value={{ monaco }}>
        <RichTextContext.Provider
          value={{
            editorStore: editorStore.current,
            executionHost: tools.newExecutionHost,
            compiler: tools.newCompiler,
            documentId: props.documentIdString,
          }}>
          <BlockNoteView editor={editor}></BlockNoteView>
        </RichTextContext.Provider>
      </MonacoContext.Provider>
    </div>
  );
});

export default Frame;
