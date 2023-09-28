import { RunContext } from "@typecell-org/engine";
import { CodeModel } from "@typecell-org/shared";
import { computed } from "mobx";
import { EditorStore } from "../../../EditorStore";
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
    editor: {
      // registerPlugin: (config: { name: string }) => {
      //   return config.name;
      // },
      registerBlock: (config: { name: string; blockExport: string }) => {
        debugger;
        // TODO: this logic should be part of CodeModel / BasicCodeModel
        const id = forModelList[forModelList.length - 1].path;
        const parts = decodeURIComponent(id.replace("file:///", "")).split("/");
        parts.pop();

        const documentId = parts.join("/");

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
    },
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
