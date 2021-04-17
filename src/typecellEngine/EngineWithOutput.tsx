import { ObservableMap } from "mobx";
import * as monaco from "monaco-editor";
import DocumentView from "../documentRenderers/DocumentView";
import { Engine } from "../engine";
import LoadingTCDocument from "../store/LoadingTCDocument";
import { createOneToManyReferenceDefinition, Ref } from "../store/Ref";
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
      doc: (identifier: string | { owner: string; document: string }) => {
        return LoadingTCDocument.load(identifier);
      },
      createOneToManyReferenceDefinition: (
        type: string,
        reverseType: string,
        sorted: boolean
      ) => {
        return createOneToManyReferenceDefinition(id, type, reverseType, sorted);
      },
    },
  };
}

let ENGINE_ID = 0;
export default class EngineWithOutput {
  private readonly disposers = new Set<() => void>();
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
    if (this.disposed) {
      throw new Error("EngineWithOutput already disposed (resolveImport called)")
    }
    const resolved = await resolveImport(module, forModel, this);
    if (this.disposed) {
      resolved.dispose(); // engine has been disposed in the meantime
    }
    this.disposers.add(resolved.dispose);
    return resolved.module;
  }

  public dispose() {
    if (this.disposed) {
      throw new Error("EngineWithOutput already disposed");
    }
    this.disposed = true;
    this.engine.dispose();
    this.disposers.forEach(d => d());
  }
}