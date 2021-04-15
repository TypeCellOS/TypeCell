import * as react from "react";
import * as reactdom from "react-dom";
import * as reactdnd from "react-dnd";
import * as monaco from "monaco-editor";
import SkypackResolver from "../engine/resolvers/SkypackResolver";
import TCDocument from "../store/TCDocument";
import { CellListModel } from "../models/CellListModel";
import { autorun } from "mobx";
import { getEngineForDoc } from "./EngineWithOutput";
import { Engine } from "../engine";
import { CellModel } from "../models/CellModel";
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

function getModel(cell: CellModel) {
  const newCode = cell.code.toJSON();
  const uri = monaco.Uri.file(cell.path);
  let model = monaco.editor.getModel(uri);
  if (!model) {
    model = monaco.editor.createModel(newCode, "typescript", uri);
  } else {
    if (model.getValue() === newCode) {
      console.warn(
        "setting same code, this is a noop. Why do we set same code?"
      );
      return model; // immediately return to prevent monaco model listeners to be fired in a loop
    }
    model.setValue(newCode);
  }
  return model;
}

// todo: caches

const cache = new Map<string, any>();

export default async function resolveImport(
  moduleName: string,
  forModel: monaco.editor.ITextModel
) {
  if (moduleName.startsWith("!@")) {
    const key = moduleName + forModel.uri.toString();
    if (cache.has(key)) {
      const ret = cache.get(key);
      return ret;
    }

    const [owner, document] = moduleName.toLowerCase().substr(1).split("/", 2);
    if (!owner || !document || document.includes("/")) {
      throw new Error("invalid module");
    }
    const doc = TCDocument.load(owner + "/" + document);

    const engine = getEngineForDoc(doc);

    autorun(() => {
      const cells = new CellListModel(doc.id, doc.data);
      const models = cells.cells.forEach((c) => {
        const model = getModel(c);
        engine.engine.registerModel(model);
        model.setValue(model.getValue()); // trick to force eval
      });
    });
    const ret = engine.engine.observableContext.context;
    cache.set(key, ret);
    return ret;
  }
  return skypackResolver.resolveImport(moduleName);
}
