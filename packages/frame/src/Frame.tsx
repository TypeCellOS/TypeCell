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
  SideMenuPositioner,
  SlashMenuPositioner,
  getDefaultReactSlashMenuItems,
  useBlockNote,
} from "@blocknote/react";
import * as mobx from "mobx";
import ReactDOM from "react-dom";
import * as Y from "yjs";
import { MonacoBlockContent } from "./MonacoBlockContent";
import { RichTextContext } from "./RichTextContext";
import SourceModelCompiler from "./runtime/compiler/SourceModelCompiler";
import { MonacoContext } from "./runtime/editor/MonacoContext";
import { ExecutionHost } from "./runtime/executor/executionHosts/ExecutionHost";
import LocalExecutionHost from "./runtime/executor/executionHosts/local/LocalExecutionHost";

import { enableMobxBindings } from "@syncedstore/yjs-reactive-bindings";
import { ReactiveEngine } from "@typecell-org/engine";
import { useResource } from "@typecell-org/util";
import * as monaco from "monaco-editor";
import { AsyncMethodReturns, connectToParent } from "penpal";
import { WebsocketProvider } from "y-websocket";
import styles from "./Frame.module.css";
import { HostBridgeMethods } from "./interop/HostBridgeMethods";
import { IframeBridgeMethods } from "./interop/IframeBridgeMethods";
import { ModelReceiver } from "./interop/ModelReceiver";
import { BasicCodeModel } from "./models/BasicCodeModel";
import { setMonacoDefaults } from "./runtime/editor";

import { MonacoColorManager } from "./MonacoColorManager";
import monacoStyles from "./MonacoSelection.module.css";
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

export const Frame: React.FC<Props> = observer((props) => {
  const modelReceivers = useMemo(() => new Map<string, ModelReceiver>(), []);
  const connectionMethods = useRef<AsyncMethodReturns<HostBridgeMethods>>();

  useEffect(() => {
    const methods: IframeBridgeMethods = {
      updateModels: async (
        bridgeId: string,
        models: {
          modelId: string;
          model: { value: string; language: string };
        }[]
      ) => {
        for (const model of models) {
          await methods.updateModel(bridgeId, model.modelId, model.model);
        }
      },
      updateModel: async (
        bridgeId: string,
        modelId: string,
        model: { value: string; language: string }
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
    connection.promise.then((parent) => {
      connectionMethods.current = parent;
    });
  }, [modelReceivers]);

  const document = useResource(() => {
    const ydoc = new Y.Doc();

    // ydoc.on("update", () => {
    //   console.log("frame ydoc", ydoc.toJSON());
    // });
    const provider = new WebsocketProvider("", props.roomName, ydoc, {
      connect: false,
    });
    const colorManager = new MonacoColorManager(
      provider.awareness,
      props.userName,
      props.userColor,
      monacoStyles.yRemoteSelectionHead,
      monacoStyles.yRemoteSelection
    );
    provider.connectBc();

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

  const tools = useResource(
    // "compilers",
    () => {
      const newCompiler = new SourceModelCompiler(monaco);
      const resolver = new Resolver(async (moduleName) => {
        // How to resolve typecell modules (i.e.: `import * as nb from "!dALYTUW8TXxsw"`)
        const subcompiler = new SourceModelCompiler(monaco);

        const modelReceiver = new ModelReceiver();
        // TODO: what if we have multiple usage of the same module?
        modelReceivers.set("modules/" + moduleName, modelReceiver);

        modelReceiver.onDidCreateModel((model) => {
          subcompiler.registerModel(model);
        });

        const fullIdentifier =
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          await connectionMethods.current!.registerTypeCellModuleCompiler(
            moduleName
          );

        // register an alias for the module so that types resolve
        // (e.g.: from "!dALYTUW8TXxsw" to "!typecell:typecell.org/dALYTUW8TXxsw")
        if ("!" + fullIdentifier !== moduleName) {
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            `export * from "!${fullIdentifier}";`,
            `file:///node_modules/@types/${moduleName}/index.d.ts`
          );
        }

        // TODO: dispose modelReceiver
        return subcompiler;
      });
      const newEngine = new ReactiveEngine<BasicCodeModel>(
        resolver.resolveImport
      );
      const newExecutionHost: ExecutionHost = new LocalExecutionHost(
        props.documentIdString,
        newCompiler,
        monaco,
        newEngine
      );
      return [
        { newCompiler, newExecutionHost },
        () => {
          newCompiler.dispose();
        },
      ];
    },
    [props.documentIdString, monaco]
  );

  // useEffect(() => {
  //   const t = tools;
  //   if (!t) {
  //     return;
  //   }
  //   return () => {
  //     t.newCompiler.dispose();
  //     t.newExecutionHost.dispose();
  //   };
  // }, [tools]);

  // useEffect(() => {
  //   // make sure color info is broadcast, and color info from other users are reflected in monaco editor styles
  //   if (document.awareness) {
  //     const colorManager = new MonacoColorManager(
  //       document.awareness,
  //       props.userName,
  //       props.userColor
  //     );
  //     return () => {
  //       colorManager.dispose();
  //     };
  //   }
  // }, [document.awareness, props.userColor, props.userName]);

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
    },
    slashMenuItems: [
      ...getDefaultReactSlashMenuItems(),
      {
        name: "Monaco",
        execute: (editor) =>
          insertOrUpdateBlock(editor, {
            type: "monaco",
          }),
        aliases: ["m"],
      },
    ],
    collaboration: {
      provider: new FakeProvider(document.awareness),
      user: {
        name: props.userName,
        color: props.userColor,
      },
      fragment: document.ydoc.getXmlFragment("doc"),
    },
  });

  return (
    <div className={styles.container}>
      <MonacoContext.Provider value={{ monaco }}>
        <RichTextContext.Provider
          value={{
            executionHost: tools.newExecutionHost,
            compiler: tools.newCompiler,
            documentId: props.documentIdString,
          }}>
          <BlockNoteView editor={editor}>
            <SideMenuPositioner editor={editor} />
            <SlashMenuPositioner editor={editor} />
          </BlockNoteView>
        </RichTextContext.Provider>
      </MonacoContext.Provider>
    </div>
  );
});

export default Frame;
