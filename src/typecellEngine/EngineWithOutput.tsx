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

let ENGINE_ID = 0;
export default class EngineWithOutput {
  private readonly disposers: Array<() => void> = [];
  private disposed: boolean = false;

  public readonly outputs = new ObservableMap<monaco.editor.ITextModel, any>();
  public readonly engine: Engine;
  public readonly id = ENGINE_ID++;
  constructor(documentId: string) {
    // console.log(this.id, documentId);
    this.engine = new Engine(
      (model, output) => {
        this.outputs.set(model, output);
      },
      getExposeGlobalVariables(documentId),
      this.resolveImport
    );
  }

  private resolveImport = async (module: string,
    forModel: monaco.editor.ITextModel) => {
    const resolved = await resolveImport(module, forModel, this);
    if (this.disposed) {
      resolved.dispose(); // engine has been disposed in the meantime
    }
    this.disposers.push(resolved.dispose);
    return resolved.module;
  }

  public dispose() {
    this.disposed = true;
    this.engine.dispose();
    this.disposers.forEach(d => d());
  }
}