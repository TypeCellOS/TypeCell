import { event, lifecycle } from "vscode-lib";
import { BasicCodeModel } from "../models/BasicCodeModel";

export type ModelProvider = {
  onDidCreateModel: event.Event<BasicCodeModel>;
  models: BasicCodeModel[];
} & lifecycle.IDisposable;
