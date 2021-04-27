import { autorun, untracked } from "mobx";
import * as react from "react";
import * as reactdnd from "react-dnd";
import * as reactdom from "react-dom";
import SkypackResolver from "../engine/resolvers/SkypackResolver";
import {
  getTypeCellCodeModel,
  TypeCellCodeModel,
} from "../models/TypeCellCodeModel";
import { DocConnection } from "../store/DocConnection";
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
  forModel: TypeCellCodeModel,
  forEngine: EngineWithOutput,
  needsTypesInMonaco: boolean
): Promise<ResolvedImport> {
  if (moduleName.startsWith("!@")) {
    const key = [forEngine.id, forModel.path, moduleName].join("$$");

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
    const doc = DocConnection.load(owner + "/" + document);

    const engine = new EngineWithOutput(doc.id, needsTypesInMonaco);

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
        const models = cells.map((c) => getTypeCellCodeModel(c));
        models.forEach((m) => {
          if (needsTypesInMonaco) {
            m.object.acquireMonacoModel();
          }
          engine.engine.registerModel(m.object);
        });
        releasePreviousModels = () => {
          models.forEach((m) => {
            if (needsTypesInMonaco) {
              m.object.releaseMonacoModel();
            }
            m.dispose();
          });
        };
      });
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
