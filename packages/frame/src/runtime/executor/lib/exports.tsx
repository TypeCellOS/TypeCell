import { RunContext } from "@typecell-org/engine";
import { CodeModel } from "@typecell-org/shared";
import { autorun, computed, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { createTransformer } from "mobx-utils";
import { useEffect, useMemo } from "react";
import { EditorStore } from "../../../EditorStore";
import { AutoForm, AutoFormProps } from "./autoForm";
import { Input } from "./input/Input";

/**
 * This is used in ../resolver/resolver.ts and exposes the "typecell" helper functions
 * (e.g.: typecell.Input)
 */
export default function getExposeGlobalVariables(
  runContext: RunContext,
  editorStore: EditorStore,
  forModelList: CodeModel[],
) {
  const editor = {
    // registerPlugin: (config: { name: string }) => {
    //   return config.name;
    // },
    registerBlock: (config: { name: string; blockExport: string }) => {
      // TODO: this logic should be part of CodeModel / BasicCodeModel
      const id = forModelList[forModelList.length - 1].path;
      const parts = decodeURIComponent(id.replace("file:///", "")).split("/");
      parts.pop();

      const documentId = parts.join("/").substring(1); // remove leading slash

      const completeConfig: any = {
        ...config,
        id,
        documentId,
      };
      console.log("ADD BLOCK", completeConfig.id);
      editorStore.add(completeConfig);

      runContext.onDispose(() => {
        console.log("REMOVE BLOCK", completeConfig.id);
        editorStore.delete(completeConfig);
      });
    },
    get firstBlock() {
      return editorStore.firstBlock;
    },
    get currentBlock() {
      // TODO: this logic should be part of CodeModel / BasicCodeModel
      const id = forModelList[forModelList.length - 1].path;
      const parts = decodeURIComponent(id.replace("file:///", "")).split("/");
      const fileId = parts.pop()!;

      const blockId = fileId.replace(".cell.tsx", "");
      return editorStore.getBlock(blockId)!;
    },

    get storage() {
      return this.currentBlock.storage;
    },
  };
  return {
    // routing,
    // // DocumentView,
    Input,
    // namespace: id, // TODO: naming
    // open: (identifier: string | { owner: string; document: string }) => {
    //   return DocConnection.load(identifier);
    // },
    // createOneToManyReferenceDefinition: (
    //   type: string,
    //   reverseType: string,
    //   sorted: boolean
    // ) => {
    //   return createOneToManyReferenceDefinition(id, type, reverseType, sorted);
    // },
    TypeVisualizer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    computed: computed as (func: () => any) => any,
    onDispose: runContext.onDispose,
    editor,
    AutoForm: observer(
      <
        T extends {
          [key: string]: unknown;
        },
      >(
        props: Exclude<AutoFormProps<T>, "settings" | "setSettings">,
      ) => {
        const storage = editor.currentBlock.storage;

        const createFunctionTransformer = useMemo(() => {
          return createTransformer((key: string) => {
            const code = storage.settings[key];
            console.log(storage.settings, code);
            if (!code) {
              return undefined;
            }
            const sanitizedCode = code.replace(
              "export default ",
              `$target["${key}"] = `,
            );
            // eslint-disable-next-line no-new-func
            const func = new Function("$target", "$", sanitizedCode);
            return () => {
              console.log("eval", key, code);
              func(props.inputObject, props.inputObject); // TODO
            };
          });
        }, [props.inputObject, storage.settings]);

        useEffect(() => {
          console.log("effect");
          const transformer = createTransformer(
            (func: () => void) => {
              if (!func) {
                return undefined;
              }
              return autorun(() => {
                func();
              });
            },
            (dispose) => {
              console.log("dispose", dispose);
              dispose?.();
            },
          );
          return autorun(() => {
            const cells = Object.keys(props.fields).map(
              createFunctionTransformer,
            );
            cells.filter((cell): cell is () => void => !!cell).map(transformer);
            console.log("cells", cells);
          });
        }, [props.fields, createFunctionTransformer]);

        return (
          <AutoForm
            {...props}
            settings={editor.currentBlock.storage.settings || {}}
            setSetting={(key: string, value: any) => {
              runInAction(() => {
                if (!editor.currentBlock.storage.settings) {
                  // TODO: might not be compatible with Yjs
                  editor.currentBlock.storage.settings = {};
                }
                editor.currentBlock.storage.settings[key] = value;
              });
            }}
          />
        );
      },
    ),
    // func: <T>(arg: T) => {
    //   return () => arg;
    // },
  };
}
export class TypeVisualizer<T> {
  // public readonly name: string;
  // public readonly function: (arg: T) => any;

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly func: (arg: T) => any,
    public readonly name?: string,
  ) {
    if (
      // strings.isFalsyOrWhitespace(visualizer.name) ||
      typeof func !== "function"
    ) {
      throw new Error("invalid args");
    }
  }
}
