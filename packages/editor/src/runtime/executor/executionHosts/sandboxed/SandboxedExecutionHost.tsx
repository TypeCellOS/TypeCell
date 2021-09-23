import { autorun, makeObservable, observable, runInAction } from "mobx";
import { AsyncMethodReturns, Connection, connectToChild } from "penpal";
import { lifecycle } from "vscode-lib";
import { CompiledCodeModel } from "../../../../models/CompiledCodeModel";
import { TypeCellCodeModel } from "../../../../models/TypeCellCodeModel";
import { ContainedElement } from "../../../../util/ContainedElement";
import SourceModelCompiler from "../../../compiler/SourceModelCompiler";
import { TypeCellModuleCompiler } from "../../resolver/typecell/TypeCellModuleCompiler";
import { ExecutionHost } from "../ExecutionHost";
import type { FrameConnection } from "./iframesandbox/FrameConnection";
import { ModelForwarder } from "./ModelForwarder";
import OutputShadow from "./OutputShadow";
import type * as monaco from "monaco-editor";
import { VisualizerExtension } from "../../../extensions/visualizer/VisualizerExtension";

// use 127.0.0.1 for iframe so that we make sure we run on a different origin
const IFRAME_URL = "http://127.0.0.1:3000/?frame";
let ENGINE_ID = 0;

export default class SandboxedExecutionHost extends lifecycle.Disposable implements ExecutionHost {
  public readonly iframe: HTMLIFrameElement;
  private disposed: boolean = false;

  private readonly connection: Connection<FrameConnection["methods"]>;
  private connectionMethods: AsyncMethodReturns<FrameConnection["methods"]> | undefined;

  // private mousePosition: {
  //   x: number;
  //   y: number;
  // } = { x: 0, y: 0 };

  private readonly dimensionStore = new Map<
    string,
    { width: number; height: number }
  >();

  private readonly positionCacheStore = new Map<
    string,
    { x: number; y: number }
  >();

  private moduleManagers = new Map<string, {
    compiler: TypeCellModuleCompiler,
    forwarder: ModelForwarder
  }>();

  public readonly id = ENGINE_ID++;

  constructor(
    private readonly documentId: string,
    private readonly compileEngine: SourceModelCompiler,
    private monacoInstance: typeof monaco
  ) {
    super();

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.pointerEvents = "all";
    iframe.style.border = "none";
    iframe.className = "fullSize";
    iframe.sandbox.add(
      "allow-same-origin",
      "allow-scripts",
      "allow-downloads",
      "allow-popups",
      "allow-modals",
      "allow-forms",
      "allow-popups-to-escape-sandbox",
      "allow-top-navigation-by-user-activation"
    );
    iframe.allow =
      "geolocation; microphone; camera; midi; encrypted-media; autoplay; accelerometer; magnetometer; gyroscope; vr";
    iframe.allowFullscreen = true;
    iframe.src =
      IFRAME_URL +
      "&documentId=" +
      encodeURIComponent(documentId) +
      (window.location.search.includes("noRun") ? "&noRun" : "");

    iframe.onmouseleave = () => {
      console.log("exit iframe");
      this.enablePointerEvents();
    };
    this.iframe = iframe;
    this.connection = connectToChild({
      // The iframe to which a connection should be made
      iframe: this.iframe,
      // Methods the parent is exposing to the child
      methods: this.methods,
    });


    // document.addEventListener("mousemove", (e) => {
    //   this.mousePosition = { x: e.clientX, y: e.clientY };
    // });

    this.initialize().then(
      () => { },
      (e) => {
        console.error(e);
      }
    );
  }



  private methods = {
    registerTypeCellModuleCompiler: async (moduleName: string) => {
      if (this.moduleManagers.has(moduleName)) {
        console.warn("already has moduleManager for", moduleName)
        return;
      }
      const compiler = (new TypeCellModuleCompiler(moduleName, this.monacoInstance));
      const forwarder = (new ModelForwarder("modules/" + moduleName, compiler, this.connectionMethods!));
      this.moduleManagers.set(moduleName, { compiler, forwarder });
      await forwarder.initialize();
    },
    unregisterTypeCellModuleCompiler: (moduleName: string) => {
      const moduleManager = this.moduleManagers.get(moduleName);
      if (!moduleManager) {
        console.warn("no moduleManager for", moduleName)
        return;
      }
      moduleManager.compiler.dispose();
      moduleManager.forwarder.dispose();
      this.moduleManagers.delete(moduleName);
    },
    mouseLeave: (id: string) => {
      this.enablePointerEvents();
    },
    setDimensions: (
      id: string,
      dimensions: { width: number; height: number }
    ) => {
      const dimensionsToSet = this.dimensionStore.get(id);
      if (!dimensionsToSet) {
        console.warn(
          "setDimensions called, but for invalid or removed model?"
        );
        return;
      }
      runInAction(() => {
        dimensionsToSet.width = dimensions.width;
        dimensionsToSet.height = dimensions.height;
      });
    },
  }
  // private checkMousePosition() {
  //   for (let [key, pos] of this.positionCacheStore.entries()) {
  //     if (this.mousePosition.x >= pos.x && this.mousePosition.y >= pos.y) {
  //       const dimensions = this.dimensionStore.get(key);
  //       if (!dimensions) {
  //         console.error("unexpected");
  //         continue;
  //       }
  //       if (
  //         this.mousePosition.x <= pos.x + dimensions.width &&
  //         this.mousePosition.y <= pos.y + dimensions.height
  //       ) {
  //         return true;
  //       }
  //     }
  //   }
  //   return false;
  // }
  // private updatePointerEvents = () => {
  //   const overOutput = this.checkMousePosition();
  //   if (overOutput) {
  //     this.disablePointerEvents();
  //   } else {
  //     this.enablePointerEvents();
  //   }
  // };

  private enablePointerEvents = () => {
    (
      this.iframe.parentElement?.parentElement as HTMLDivElement
    ).style.pointerEvents = "auto";
    // console.log("enable");
  };

  private disablePointerEvents = () => {
    (
      this.iframe.parentElement?.parentElement as HTMLDivElement
    ).style.pointerEvents = "none";
    // console.log("disable");
  };

  async initialize() {
    console.log("initialize IFrameEngine");

    this._register(this.compileEngine.onDidCreateCompiledModel((m) => this.registerModel(m)));
    for (let model of this.compileEngine.compiledModels) {
      this.registerModel(model);
    }

    this.connectionMethods = await this.connection.promise;
    console.log("IFrameEngine connection established");
    // const result = await this.connectionMethods.ping();
    // console.log("received", result);

    const forwarder = this._register(new ModelForwarder("main", this.compileEngine, this.connectionMethods));
    await forwarder.initialize();

    for (let model of this.compileEngine.compiledModels) {
      // send initial positions
      console.log("initial positions", this.positionCacheStore.get(model.path))
      await this.sendModelPositions(model, this.positionCacheStore.get(model.path)!);
    }

    const visualizerExtension = this._register(new VisualizerExtension(this.compileEngine, this.documentId, this.monacoInstance));

    this._register(visualizerExtension.onUpdateVisualizers(e => {
      this.connectionMethods!.updateVisualizers(e);
    }));
  }

  private async sendModelPositions(model: CompiledCodeModel, positions: { x: number, y: number }) {
    console.log("send update positions", model.path, positions);
    await this.connectionMethods!.updatePositions(model.path, positions);
  }

  /**
   * Register a model to the engine. After registering, the model will be observed for changes and automatically re-evaluated.
   *
   * When the model is disposed (model.dispose()), the model is automatically unregistered.
   * @param model model to register
   */
  private registerModel(model: CompiledCodeModel) {
    if (this.disposed) {
      throw new Error("registering model on disposed engine");
    }
    // if (this.registeredModels.has(model)) {
    //   console.warn("model already registered"); // TODO: shouldn't happen
    //   return;
    // }
    const positionCache = { x: 0, y: 0 };
    this.dimensionStore.set(
      model.path,
      makeObservable(
        { width: 0, height: 0 },
        { width: observable.ref, height: observable.ref }
      )
    );
    this.positionCacheStore.set(
      model.path,
      makeObservable(positionCache, { x: observable.ref, y: observable.ref })
    );


    let dispose = autorun(() => {
      const positions = { x: positionCache.x, y: positionCache.y };
      if (this.connectionMethods) {
        console.log("update positions", this.positionCacheStore.get(model.path))
        this.sendModelPositions(model, positions);
      } else {
        console.log("delay sending positions, connection not established")
      }
    });


    this._register(
      model.onWillDispose(() => {
        this.positionCacheStore.delete(model.path);
        this.dimensionStore.delete(model.path);
        // this.registeredModels.delete(model);
        dispose();
      })
    );
  }

  public renderContainer() {
    return <ContainedElement element={this.iframe} />;
  }

  public renderOutput(model: TypeCellCodeModel) {
    return (
      <OutputShadow
        dimensions={this.dimensionStore.get(model.path)!}
        positionOffsetElement={this.iframe}
        positions={this.positionCacheStore.get(model.path)!}
        onMouseMove={this.disablePointerEvents}
      />
    );
  }

  public dispose() {
    if (this.disposed) {
      throw new Error("EngineWithOutput already disposed");
    }
    this.disposed = true;

    this.moduleManagers.forEach(m => {
      m.forwarder.dispose();
      m.compiler.dispose();
    });

    this.moduleManagers.clear();

    super.dispose();
  }
}
