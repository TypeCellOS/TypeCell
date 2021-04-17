import { autorun, untracked } from "mobx";
import * as monaco from "monaco-editor";
import * as react from "react";
import * as reactdnd from "react-dnd";
import * as reactdom from "react-dom";
import SkypackResolver from "../engine/resolvers/SkypackResolver";
import { CellListModel } from "../models/CellListModel";
import { getModel, releaseModel } from "../models/modelCache";
import LoadingTCDocument from "../store/LoadingTCDocument";
import TCDocument from "../store/TCDocument";
import EngineWithOutput from "./EngineWithOutput";
const sz = require("frontend-collective-react-dnd-scrollzone");

function resolveNestedModule(id: string) {
  function isModule(id: string, moduleName: string) {
    return id === moduleName || id === "https://cdn.skypack.dev/" + moduleName;
  }

  if (isModule(id, "react")) {
    return react;
  }

  if (isModule(id, "react-dom")) {
    return reactdom;
  }

  if (isModule(id, "frontend-collective-react-dnd-scrollzone")) {
    return sz;
  }

  if (isModule(id, "react-dnd")) {
    return reactdnd;
  }

  return undefined;
}

const skypackResolver = new SkypackResolver(resolveNestedModule);

// todo: caches

const cache = new Map<string, ResolvedImport>();

type ResolvedImport = {
  module: any;
  dispose: () => void;
};

export default async function resolveImport(
  moduleName: string,
  forModel: monaco.editor.ITextModel,
  forEngine: EngineWithOutput
): Promise<ResolvedImport> {
  if (moduleName.startsWith("!@")) {
    const key = [forEngine.id, forModel.uri.toString(), moduleName].join("$$");

    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    const [owner, document] = moduleName.toLowerCase().substr(1).split("/", 2);
    if (!owner || !document || document.includes("/")) {
      throw new Error("invalid module");
    }
    // use string identifier directly instead of passing { owner, document},
    // because in code, we should use the correct slug at all times
    // (i.e.: don't allow import "@YousefED/hello world", but "@yousefed/hello-world") for consistency
    const doc = LoadingTCDocument.load(owner + "/" + document);

    const engine = new EngineWithOutput(doc.id);

    let releasePreviousModels = () => {};
    // TODO: refactor, and releaseModel()
    const disposeAutorun = autorun(() => {
      const cells = doc.doc?.cells;
      if (!cells) {
        return;
      }
      untracked(() => {
        // untracked, because getModel accesses observable data in the cell (code.tostring)
        releasePreviousModels();
        cells.forEach((c) => {
          const model = getModel(c);
          engine.engine.registerModel(model);
        });
      });
      releasePreviousModels = () => {
        cells.forEach((c) => releaseModel(c));
      };
    });

    let disposed = false;
    const ret = {
      module: engine.engine.observableContext.context,
      dispose: () => {
        if (disposed) {
          throw new Error("already disposed");
        }
        cache.delete(key);
        disposed = true;
        disposeAutorun();
        engine.dispose();
        doc.dispose();
        releasePreviousModels();
      },
    };
    cache.set(key, ret);
    return ret;
  }
  return skypackResolver.resolveImport(moduleName);
}
