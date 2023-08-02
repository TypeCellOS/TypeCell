import { autorun } from "mobx";
import { event, lifecycle } from "vscode-lib";
import * as Y from "yjs";
import { BasicCodeModel } from "../../../frame/src/models/BasicCodeModel";
import { Identifier } from "../identifiers/Identifier";
import { DocConnection } from "./DocConnection";
import { SessionStore } from "./local/SessionStore";

type ModelProvider = {
  onDidCreateModel: event.Event<BasicCodeModel>;
  models: BasicCodeModel[];
};

export class DocumentResourceModelProvider
  extends lifecycle.Disposable
  implements ModelProvider
{
  private readonly connection: DocConnection;
  private readonly modelMap = new Map<string, BasicCodeModel>();

  private readonly _onDidCreateModel: event.Emitter<BasicCodeModel> =
    this._register(new event.Emitter<BasicCodeModel>());

  public readonly onDidCreateModel: event.Event<BasicCodeModel> =
    this._onDidCreateModel.event;

  public get models() {
    return Array.from(this.modelMap.values());
  }

  constructor(identifier: Identifier, sessionStore: SessionStore) {
    super();

    this.connection = DocConnection.load(identifier, sessionStore);

    // TODO: on every change we loop all contents. We can make this more efficient using a yjs observer
    const disposeAutorun = autorun(() => {
      const data = this.connection.tryDoc?.doc.data;
      if (!data) {
        return;
      }
      const codeNodes = data.querySelectorAll("code");
      const seenIds = new Set<string>();
      const createdModels = new Set<BasicCodeModel>();

      for (let node of codeNodes) {
        if (!(node instanceof Y.XmlElement)) {
          throw new Error("should be xml element");
        }
        const id = node.getAttribute("block-id");
        if (!id) {
          throw new Error("no id specified");
        }

        const code = node.firstChild;
        if (!code || !(code instanceof Y.XmlText)) {
          throw new Error("should be text");
        }

        let attrLanguage = node.getAttribute("language");
        if (!attrLanguage) {
          throw new Error("no language specified");
        }

        seenIds.add(id);
        let model = this.modelMap.get(id);
        if (model) {
          if (model.language !== attrLanguage) {
            model.dispose();
            model = undefined;
          } else {
            model.setValue(code.toString());
          }
        }

        if (!model) {
          model = new BasicCodeModel(id, code.toString(), attrLanguage);
          this.modelMap.set(id, model);
          createdModels.add(model);
        }
      }

      for (let [id, model] of this.modelMap) {
        if (!seenIds.has(id)) {
          model.dispose();
          this.modelMap.delete(id);
        }
      }

      for (let model of createdModels) {
        this._onDidCreateModel.fire(model);
      }
    });

    this._register({
      dispose: disposeAutorun,
    });
  }

  public dispose() {
    super.dispose();

    this.connection.dispose();
    for (let model of this.modelMap.values()) {
      model.dispose();
    }
    this.modelMap.clear();
  }
}
