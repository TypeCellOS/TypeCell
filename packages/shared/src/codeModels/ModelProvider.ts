import { event, lifecycle } from "vscode-lib";
import { BasicCodeModel } from "./BasicCodeModel.js";

export type ModelProvider = {
  onDidCreateModel: event.Event<BasicCodeModel>;
  models: BasicCodeModel[];
} & lifecycle.IDisposable;
