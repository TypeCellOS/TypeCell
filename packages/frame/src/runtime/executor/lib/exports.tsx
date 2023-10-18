import { RunContext } from "@typecell-org/engine";
import { CodeModel } from "@typecell-org/shared";
import memoize from "lodash.memoize";
import { autorun, comparer, computed, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { computedFn, createTransformer } from "mobx-utils";
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
    registerBlock: (config: {
      name: string;
      blockExport: string;
      settings?: Record<string, boolean>;
    }) => {
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
      editorStore.addCustomBlock(completeConfig);

      runContext.onDispose(() => {
        console.log("REMOVE BLOCK", completeConfig.id);
        editorStore.deleteCustomBlock(completeConfig);
      });
    },
    registerBlockSettings: (config: any) => {
      // TODO: this logic should be part of CodeModel / BasicCodeModel
      const id = forModelList[forModelList.length - 1].uri;

      const completeConfig: any = {
        ...config,
        id: id.toString(),
      };
      // console.log("ADD BLOCK", completeConfig.id);
      editorStore.addBlockSettings(completeConfig);

      runContext.onDispose(() => {
        // console.log("REMOVE BLOCK", completeConfig.id);
        editorStore.deleteBlockSettings(completeConfig);
      });
    },
    /**
     * EXPERIMENTAL
     */
    getBlock(id: string): any {
      return editorStore.getBlock(id);
    },
    /**
     * EXPERIMENTAL
     */
    get firstBlock(): any {
      return editorStore.firstBlock;
    },
    /**
     * EXPERIMENTAL
     */
    get currentBlock(): any {
      // TODO: this logic should be part of CodeModel / BasicCodeModel
      const id = forModelList[forModelList.length - 1].path;
      const parts = decodeURIComponent(id.replace("file:///", "")).split("/");
      const fileId = parts.pop()!.split("_")[0];

      const blockId = fileId.replace(".cell.tsx", "");
      return editorStore.getBlock(blockId)!;
    },
    /**
     * EXPERIMENTAL
     */
    findBlocks: computedFn(
      (predicate: (block: any) => boolean) => {
        const result: any[] = [];

        function find(children: any[]) {
          for (const block of children) {
            const asBlock = editorStore.getBlock(block.id)!;
            if (predicate(asBlock)) {
              result.push(asBlock);
            }
            find(block.children);
          }
        }
        find(editorStore.topLevelBlocks);
        return result;
      },
      { equals: comparer.structural },
    ),
    /**
     * EXPERIMENTAL
     */
    findBlockUp(predicate: (block: any) => boolean): any {
      function find(currentBlock: any): any {
        const parent = currentBlock.parent;
        let children = parent?.children;
        if (!children) {
          children = editorStore.topLevelBlocks;
        }

        let foundSelf = false;
        for (let i = children.length - 1; i >= 0; i--) {
          const block = children[i];
          if (!foundSelf) {
            if (block.id === currentBlock.id) {
              foundSelf = true;
            }
            continue;
          }
          const asBlock = editorStore.getBlock(block.id)!;
          if (predicate(asBlock)) {
            return asBlock;
          }
        }

        return parent ? find(parent) : undefined;
      }
      return find(this.currentBlock);
    },
    /**
     * EXPERIMENTAL
     */
    get storage() {
      return this.currentBlock.storage;
    },
  };
  return {
    memoize: <T extends (...args: any[]) => any>(func: T): T => {
      const wrapped = async function (this: any, ...args: any[]) {
        const ret = await func.apply(this, args);
        // if (typeof ret === "object") {
        //   return observable(ret);
        // }
        return ret;
      };
      return memoize(wrapped, (args) => {
        return JSON.stringify(args);
      }) as any as T;
    },
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
        props: Exclude<AutoFormProps<T>, "settings" | "setSettings"> & {
          visible: boolean;
        },
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
              func(props.inputObject, runContext.context.context);
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

        if (!props.visible) {
          return <></>;
        }

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
