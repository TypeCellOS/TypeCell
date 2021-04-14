import { ObservableMap } from "mobx";
import * as monaco from "monaco-editor";
import DocumentView from "../DocumentView";
import { Engine } from "../engine";
import { Ref } from "../store/Ref";
import TCDocument from "../store/TCDocument";
import routing from "../util/routing";
import resolveImport from "./resolver";

// TODO: maybe use regular imports?
function getExposeGlobalVariables(id: string) {
  return {
    typecell: {
      routing,
      DocumentView,
      namespace: id, // TODO: naming
      doc: (ref: string | { owner: string; document: string }) => {
        if (!ref) {
          throw new Error("invalid arguments for doc");
        }
        if (typeof ref !== "string") {
          if (!ref.owner || !ref.document) {
            throw new Error("invalid arguments for doc");
          }
          ref = ref.owner + "/" + ref.document;
        }

        if (!ref.startsWith("@") || !ref.includes("/")) {
          throw new Error("invalid arguments for doc");
        }
        // TODO: dispose
        return TCDocument.load(ref, "!notebook");
      },
      createRef: (
        type: string,
        target: string,
        oneToMany: boolean,
        reverseInfo: {
          oneToMany: boolean;
          type: string;
        }
      ) => {
        return new Ref(id, type, target, oneToMany, reverseInfo);
      },
    },
  };
}

export default class EngineWithOutput {
  public readonly outputs = new ObservableMap<monaco.editor.ITextModel, any>();
  public readonly engine: Engine;
  constructor(id: string) {
    this.engine = new Engine(
      (model, output) => {
        this.outputs.set(model, output);
      },
      getExposeGlobalVariables(id),
      resolveImport
    );
  }
}

const enginesByDoc = new Map<string, EngineWithOutput>();

export function getEngineForDoc(doc: TCDocument) {
  if (!enginesByDoc.has(doc.id)) {
    enginesByDoc.set(doc.id, new EngineWithOutput(doc.id));
  }
  return enginesByDoc.get(doc.id)!;
}
