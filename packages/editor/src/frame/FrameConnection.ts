import { observable, runInAction } from "mobx";
import { Connection, connectToParent } from "penpal";
import { Engine } from "@typecell-org/engine";
import { ModelOutput } from "../typecellEngine/ModelOutput";
import { getTypeCellResolver } from "../typecellEngine/resolver";
import { lifecycle } from "vscode-lib";
import { FrameCodeModel } from "./FrameCodeModel";

let ENGINE_ID = 0;

export class FrameConnection extends lifecycle.Disposable {
  private readonly connection: Connection<any>;
  private connectionMethods: any;
  private readonly engine: Engine<FrameCodeModel>;

  public readonly id = ENGINE_ID++;

  // TODO: maybe observable map is not necessary / we can easily remove mobx dependency here
  public readonly outputs = observable.map<FrameCodeModel, ModelOutput>(
    undefined,
    {
      deep: false,
    }
  );

  private readonly models = new Map<string, FrameCodeModel>();

  constructor() {
    super();
    this.engine = new Engine<FrameCodeModel>(
      getTypeCellResolver("TODO", "EWO" + this.id, false, undefined as any) // TODO
    );

    this._register(
      this.engine.onOutput(({ model, output }) => {
        let modelOutput = this.outputs.get(model);
        if (!modelOutput) {
          modelOutput = this._register(new ModelOutput("", model));
          this.outputs.set(model, modelOutput);
        }
        modelOutput.updateValue(output);
      })
    );

    this.connection = connectToParent({
      // Methods child is exposing to parent
      methods: {
        updateModel: this.updateModel,
        deleteModel: this.deleteModel,
        updatePositions: this.updatePositions,
        ping: () => {
          console.log("ping received, sending pong");
          return "pong";
        },
      },
    });
    this.initialize().then(
      () => {
        console.log("FrameConnection connection established");
      },
      (e) => {
        console.error("FrameConnection connection failed", e);
      }
    );
  }

  public setDimensions(
    path: string,
    dimensions: { width: number; height: number }
  ) {
    this.connectionMethods!.setDimensions(path, dimensions);
  }

  public mouseLeave(path: string) {
    console.log("mouseLeave");
    this.connectionMethods!.mouseLeave(path);
  }

  private updateModel = async (id: string, javascriptCode: string) => {
    console.log("updateModel", id);
    let model = this.models.get(id);
    if (!model) {
      model = new FrameCodeModel(id, javascriptCode);
      this.engine.registerModel(model);
      this.models.set(id, model);
    } else {
      model.setValue(javascriptCode);
    }
  };

  private deleteModel = async (id: string) => {
    console.log("deleteModel", id);
    let model = this.models.get(id);
    if (model) {
      this.outputs.delete(model);
      this.models.delete(id);
      model.dispose();
    }
  };

  private updatePositions = async (
    id: string,
    positions: { x: number; y: number }
  ) => {
    console.log("updatePositions", id, positions);
    let model = this.models.get(id);
    if (model) {
      runInAction(() => {
        model!.positions.x = positions.x;
        model!.positions.y = positions.y;
      });
    }
  };

  async initialize() {
    console.log("initialize FrameConnection");
    this.connectionMethods = await this.connection.promise;
  }
}
