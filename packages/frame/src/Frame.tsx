import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  filterSuggestionItems,
  insertOrUpdateBlock,
} from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  useCreateBlockNote,
} from "@blocknote/react";
import { RiCodeSSlashFill } from "react-icons/ri";

import { enableMobxBindings } from "@syncedstore/yjs-reactive-bindings";
import { ReactiveEngine } from "@typecell-org/engine";
import {
  BasicCodeModel,
  HostBridgeMethods,
  IframeBridgeMethods,
  ModelReceiver,
} from "@typecell-org/shared";
import { useResource, variables } from "@typecell-org/util";
import { PenPalProvider } from "@typecell-org/y-penpal";
import * as mobx from "mobx";
import * as monaco from "monaco-editor";
import { AsyncMethodReturns, connectToParent } from "penpal";
import ReactDOM from "react-dom";
import * as Y from "yjs";
import styles from "./Frame.module.css";
import { RichTextContext } from "./RichTextContext";
import SourceModelCompiler from "./runtime/compiler/SourceModelCompiler";
import { MonacoContext } from "./runtime/editor/MonacoContext";
import { ExecutionHost } from "./runtime/executor/executionHosts/ExecutionHost";
import LocalExecutionHost from "./runtime/executor/executionHosts/local/LocalExecutionHost";

import { setMonacoDefaults } from "./runtime/editor";

import { reaction } from "mobx";
import { uri } from "vscode-lib";
import { EditorStore } from "./EditorStore";
import { MonacoColorManager } from "./MonacoColorManager";
import { MonacoCodeBlock } from "./codeblocks/MonacoCodeBlock";
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

type Props = {
  documentIdString: string;
  roomName: string;
  userName: string;
  userColor: string;
};
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    codeblock: MonacoCodeBlock,
    inlineCode: MonacoInlineCode,
  },
});

export const Frame: React.FC<Props> = observer((props) => {
  const modelReceivers = useMemo(() => new Map<string, ModelReceiver>(), []);
  const subCompilers = useMemo(
    () => new Map<string, SourceModelCompiler>(),
    [],
  );
  const connectionMethods = useRef<AsyncMethodReturns<HostBridgeMethods>>();
  const editorStore = useRef(new EditorStore());

  // listen to custom blocks and mark exposed plugins to the parent window, so these can be displayed in the plugin dialog
  useEffect(() => {
    return reaction(
      () => editorStore.current.customBlocks.toJSON(),
      (data, prev) => {
        const oldItems = new Set(prev?.map((data) => data[1].documentId) ?? []);
        const newItems = new Set(data?.map((data) => data[1].documentId) ?? []);

        for (const item of oldItems) {
          if (!newItems.has(item)) {
            connectionMethods.current?.markPlugins(item, false);
          }
        }

        for (const item of newItems) {
          if (!oldItems.has(item)) {
            connectionMethods.current?.markPlugins(item, true);
          }
        }
      },
    );
  }, [editorStore.current]);

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
        console.log("register models", modelId);
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

        // mark as false until code has been executed and we surely know doc still contains plugins
        parent.markPlugins(props.documentIdString, false);
      },
      (e) => {
        console.error("connection to parent window failed", e);
      },
    );
  }, [modelReceivers, document, props.documentIdString]);

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
        // mark as false until code has been executed and we surely know doc still contains plugins
        connectionMethods.current!.markPlugins(fullIdentifier, false);
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

      const newExecutionHost: ExecutionHost = new LocalExecutionHost(
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

  const editor = useCreateBlockNote({
    defaultStyles: false,
    domAttributes: {
      editor: {
        class: styles.editor + " markdown-body",
        "data-test": "editor",
      },
    },
    schema,
    collaboration: {
      provider: new FakeProvider(document.awareness),
      user: {
        name: props.userName,
        color: props.userColor,
      },
      fragment: document.ydoc.getXmlFragment("doc"),
    },
  });

  useEffect(() => {
    const pluginModels = new Map<string, BasicCodeModel>();

    const observer = () => {
      const plugins = document.ydoc.getMap("plugins");
      const keys = [...plugins.keys()];
      for (const key of keys) {
        const code = `import * as doc from "!${key.toString()}"; export default { doc };`;
        const path = uri.URI.parse(
          "file:///!plugins/" + key.toString() + ".cell.tsx",
        ).toString();
        const model = new BasicCodeModel(path, code, "typescript");
        pluginModels.set(key, model);
        tools.newCompiler.registerModel(model);
      }

      for (const [key, model] of pluginModels) {
        if (!plugins.has(key)) {
          model.dispose();
          pluginModels.delete(key);
        }
      }
    };

    observer();
    document.ydoc.getMap("plugins").observeDeep(observer);

    return () => {
      document.ydoc.getMap("plugins").unobserveDeep(observer);
      for (const [key, model] of pluginModels) {
        model.dispose();
        pluginModels.delete(key);
      }
    };
  }, [document.ydoc, tools.newExecutionHost.engine]);

  const getSlashMenuItems = useCallback(
    async (query: string) => {
      const pluginBlocks = [...editorStore.current.customBlocks.values()].map(
        (data) => {
          return {
            title: data.name,
            onItemClick: () => {
              const origVarName = variables.toCamelCaseVariableName(data.name);
              let varName = origVarName;
              let i = 0;
              // eslint-disable-next-line no-constant-condition
              while (true) {
                // append _1, _2, _3, ... to the variable name until it is unique

                if (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (
                    tools.newExecutionHost.engine.observableContext
                      .rawContext as any
                  )[varName] === undefined
                ) {
                  break;
                }
                i++;
                varName = origVarName + "_" + i;
              }

              insertOrUpdateBlock(editor, {
                type: "codeblock",
                props: {
                  language: "typescript",
                  // moduleName: moduleName,
                  // key,
                  storage: "",
                },
                content: `// @default-collapsed
  import * as doc from "!${data.documentId}";
  
  export let ${varName} = doc.${data.blockVariable};
  export let ${varName}Scope = doc;
  
  export default ${varName};
  `,
              });
            },
            group: "Custom",
          };
        },
      );

      return filterSuggestionItems(
        [
          ...getDefaultReactSlashMenuItems(editor),
          {
            title: "Code block",
            onItemClick: () =>
              insertOrUpdateBlock(editor, {
                type: "codeblock",
              }),
            aliases: ["code"],
            subtext: "Add a live code block",
            group: "Code",
            icon: <RiCodeSSlashFill size={18} />,
          },
          {
            title: "Inline code",
            onItemClick: () => {
              const node = editor._tiptapEditor.schema.node(
                "inlineCode",
                undefined,
                editor._tiptapEditor.schema.text("export default "),
              );
              const tr =
                editor._tiptapEditor.state.tr.replaceSelectionWith(node);
              editor._tiptapEditor.view.dispatch(tr);
            },
            subtext: "Add an inline live code block",
            group: "Code",
            icon: <RiCodeSSlashFill size={18} />,
          },
          ...pluginBlocks,
        ],
        query,
      );
    },
    [editor, editorStore.current.customBlocks],
  );

  if (editorStore.current.editor !== editor) {
    editorStore.current.editor = editor;
  }

  if (editorStore.current.executionHost !== tools.newExecutionHost) {
    editorStore.current.executionHost = tools.newExecutionHost;
  }

  return (
    <div className={styles.container}>
      <MonacoContext.Provider value={{ monaco }}>
        <RichTextContext.Provider
          value={{
            executionHost: tools.newExecutionHost,
            compiler: tools.newCompiler,
            documentId: props.documentIdString,
          }}>
          <BlockNoteView editor={editor} slashMenu={false}>
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={getSlashMenuItems}></SuggestionMenuController>
          </BlockNoteView>
        </RichTextContext.Provider>
      </MonacoContext.Provider>
    </div>
  );
});

export default Frame;
