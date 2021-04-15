import { autorun } from "mobx";
import * as monaco from "monaco-editor";
import * as react from "react";
import * as reactdnd from "react-dnd";
import * as reactdom from "react-dom";
import SkypackResolver from "../engine/resolvers/SkypackResolver";
import { CellListModel } from "../models/CellListModel";
import { getModel } from "../models/modelCache";
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
    const doc = TCDocument.load(owner + "/" + document);

    const engine = new EngineWithOutput(doc.id);

    const disposeAutorun = autorun(() => {
      const cells = new CellListModel(doc.id, doc.data);
      const models = cells.cells.forEach((c) => {
        const model = getModel(c);
        engine.engine.registerModel(model);
        // model.setValue(model.getValue()); // trick to force eval
      });
    });
    const ret = {
      module: engine.engine.observableContext.context,
      dispose: () => {
        disposeAutorun();
        engine.dispose();
      },
    };
    cache.set(key, ret);
    return ret;
  }
  return skypackResolver.resolveImport(moduleName);
}
