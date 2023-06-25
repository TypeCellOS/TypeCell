import { FlagGroup } from "@atlaskit/flag";
import { autorun, makeObservable, observable, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import type * as monaco from "monaco-editor";
import { AsyncMethodReturns, Connection, connectToChild } from "penpal";
import { lifecycle } from "vscode-lib";
import { getFrameDomain } from "../../../../config/security";
import { CompiledCodeModel } from "../../../../models/CompiledCodeModel";
import { SessionStore } from "../../../../store/local/SessionStore";
import { ContainedElement } from "../../../../util/ContainedElement";
import SourceModelCompiler from "../../../compiler/SourceModelCompiler";
import { VisualizerExtension } from "../../../extensions/visualizer/VisualizerExtension";
import { TypeCellModuleCompiler } from "../../resolver/typecell/TypeCellModuleCompiler";
import { ExecutionHost } from "../ExecutionHost";
import { FreezeAlert } from "./FreezeAlert";
import { HostBridgeMethods } from "./HostBridgeMethods";
import { ModelForwarder } from "./ModelForwarder";
import OutputShadow from "./OutputShadow";
import { IframeBridgeMethods } from "./iframesandbox/IframeBridgeMethods";

let ENGINE_ID = 0;
const FREEZE_TIMEOUT = 3000;

/**
 * The SandboxedExecutionHost evaluates end-user code in an iframe on a different domain
 * (see README.md)
 */
export default class SandboxedExecutionHost
  extends lifecycle.Disposable
  implements ExecutionHost
{
  public readonly id = ENGINE_ID++;

  public showFreezeAlert = observable.box(false);

  public readonly iframe: HTMLIFrameElement;

  private disposed: boolean = false;

  private resetHovering = () => {};

  /**
   * Penpal postmessage connection to the iframe
   */
  private readonly connection: Connection<IframeBridgeMethods>;

  /**
   * Penpal postmessage connection methods exposed by the iframe
   */
  private connectionMethods:
    | AsyncMethodReturns<IframeBridgeMethods>
    | undefined;

  /**
   * map of <cellPath, dimensions> keeping track of the dimensions of all cells (passed in from the iframe)
   */
  private readonly dimensionStore = new Map<
    string,
    { width: number; height: number }
  >();

  /**
   * map of <cellPath, position> keeping track of the x,y positions of all cells,
   * passed to the iframe when changed
   */
  private readonly positionCacheStore = new Map<
    string,
    { x: number; y: number }
  >();

  /**
   * moduleManager with key "main" is used to pass code models of the
   *  main notebook (with documentId) to the iframe
   *
   * moduleManagers with other keys are used to pass code models of TypeCell modules (!@username/notebook)
   * to the iframe
   */
  private moduleManagers = new Map<
    string,
    {
      compiler: TypeCellModuleCompiler;
      forwarder: ModelForwarder;
    }
  >();

  constructor(
    private readonly documentId: string,
    private readonly compileEngine: SourceModelCompiler,
    private monacoInstance: typeof monaco,
    private readonly sessionStore: SessionStore
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
      "geolocation; microphone; camera; midi; encrypted-media; autoplay; accelerometer; magnetometer; gyroscope";
    iframe.allowFullscreen = true;
    iframe.src =
      window.location.protocol +
      "//" +
      getFrameDomain() +
      "/?frame" +
      "&documentId=" +
      encodeURIComponent(documentId) +
      (window.location.search.includes("noRun") ? "&noRun" : "");

    iframe.onmouseleave = () => {
      // console.log("exit iframe");
      this.enableIframePointerEvents();
      this.resetHovering();
    };
    this.iframe = iframe;
    this.connection = connectToChild({
      // The iframe to which a connection should be made
      iframe: this.iframe,
      // Methods the parent is exposing to the child
      methods: this.methods,
    });

    this.initialize().then(
      () => {},
      (e) => {
        console.error(e);
      }
    );
  }

  /**
   * Methods exposed to the iframe
   */
  private methods: HostBridgeMethods = {
    /**
     * The iframe requests the compiled code of an imported TypeCell module (e.g.: !@username/notebook)
     * We set up a compiler and modelforwarder to pass compiled code back to the iframe
     */
    registerTypeCellModuleCompiler: async (moduleName: string) => {
      if (this.moduleManagers.has(moduleName)) {
        console.warn("already has moduleManager for", moduleName);
        return;
      }
      const compiler = new TypeCellModuleCompiler(
        moduleName,
        this.monacoInstance,
        this.sessionStore
      );
      const forwarder = new ModelForwarder(
        "modules/" + moduleName,
        compiler,
        this.connectionMethods!
      );
      this.moduleManagers.set(moduleName, { compiler, forwarder });
      await forwarder.initialize();
    },
    unregisterTypeCellModuleCompiler: async (moduleName: string) => {
      const moduleManager = this.moduleManagers.get(moduleName);
      if (!moduleManager) {
        console.warn("no moduleManager for", moduleName);
        return;
      }
      moduleManager.compiler.dispose();
      moduleManager.forwarder.dispose();
      this.moduleManagers.delete(moduleName);
    },
    /**
     * The mouse has left the Output of a cell in the iframe
     */
    mouseLeave: async () => {
      this.enableIframePointerEvents();
    },
    /**
     * Update the dimensions of a cells output
     */
    setDimensions: async (
      id: string,
      dimensions: { width: number; height: number }
    ) => {
      const dimensionsToSet = this.dimensionStore.get(id);
      if (!dimensionsToSet) {
        console.warn("setDimensions called, but for invalid or removed model?");
        return;
      }
      runInAction(() => {
        dimensionsToSet.width = dimensions.width;
        dimensionsToSet.height = dimensions.height;
      });
    },
  };

  /**
   * the iframe should capture mouse events
   */
  private enableIframePointerEvents = () => {
    (
      this.iframe.parentElement?.parentElement as HTMLDivElement
    ).style.pointerEvents = "auto";
  };

  /**
   * The host should capture mouse events
   * (disable pointer events on the iframe)
   */
  private disableIframePointerEvents = () => {
    (
      this.iframe.parentElement?.parentElement as HTMLDivElement
    ).style.pointerEvents = "none";
  };

  async initialize() {
    console.log("initialize IFrameEngine");

    this._register(
      this.compileEngine.onDidCreateCompiledModel((m) => this.registerModel(m))
    );
    for (let model of this.compileEngine.compiledModels) {
      this.registerModel(model);
    }

    this.connectionMethods = await this.connection.promise;
    console.log("IFrameEngine connection established");

    const forwarder = this._register(
      new ModelForwarder("main", this.compileEngine, this.connectionMethods)
    );
    await forwarder.initialize();

    for (let model of this.compileEngine.compiledModels) {
      // send initial positions
      console.log("initial positions", this.positionCacheStore.get(model.path));
      await this.sendModelPositions(
        model,
        this.positionCacheStore.get(model.path)!
      );
    }

    // type visualizers (experimental)
    const visualizerExtension = this._register(
      new VisualizerExtension(
        this.compileEngine,
        this.documentId,
        this.monacoInstance
      )
    );

    this._register(
      visualizerExtension.onUpdateVisualizers((e) => {
        this.connectionMethods!.updateVisualizers(e);
      })
    );

    this.setupPing();
  }

  /**
   * Keep pinging the iframe, and show a "freeze" alert if we haven't received a pong in time
   * (can happen in case of infinite loops in user code)
   */
  private setupPing() {
    const handle = setInterval(async () => {
      try {
        await Promise.race([
          this.pingFrame(),
          new Promise((_, reject) => {
            setTimeout(reject, FREEZE_TIMEOUT);
          }),
        ]);
        runInAction(() => {
          this.showFreezeAlert.set(false);
        });
      } catch {
        runInAction(() => {
          this.showFreezeAlert.set(true);
        });
      }
    }, FREEZE_TIMEOUT);
    this._register({
      dispose: () => clearInterval(handle),
    });
  }

  private async pingFrame() {
    const result = await this.connectionMethods!.ping();
    // console.log("received ping result", result);
    if (result !== "pong") {
      throw new Error("invalid ping response");
    }
  }

  /**
   * Pass the updated positions where a Cell's output should be shown to the iframe
   */
  private async sendModelPositions(
    model: CompiledCodeModel,
    positions: { x: number; y: number }
  ) {
    // console.log("send update positions", model.path, positions);
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
        // console.log(
        //   "update positions",
        //   this.positionCacheStore.get(model.path)
        // );
        this.sendModelPositions(model, positions);
      } else {
        console.log("delay sending positions, connection not established");
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

  private FlagComponent = observer((props: {}) => {
    if (!this.showFreezeAlert.get()) {
      return null;
    }
    const reload = () => {
      // eslint-disable-next-line no-self-assign
      window.location.href = window.location.href;
    };
    return (
      <FlagGroup>
        <FreezeAlert onReload={reload}></FreezeAlert>
      </FlagGroup>
    );
  });

  /**
   * Renders the iframe and "freeze flag". Called by NotebookRenderer
   */
  public renderContainer() {
    const FlagComponent = this.FlagComponent;
    return (
      <>
        <FlagComponent />
        <ContainedElement element={this.iframe} />
      </>
    );
  }

  /**
   * Render the output of a specific model (cell).
   * We render an OutputShadow to keep track of positions,
   * but the actual output is rendered in the iframe
   */
  public renderOutput(
    modelPath: string,
    setHovering: (hover: boolean) => void
  ) {
    return (
      <OutputShadow
        // dimensions are determined by the iframe which knows the actual output dimensions
        dimensions={this.dimensionStore.get(modelPath)!}
        positionOffsetElement={this.iframe}
        positions={this.positionCacheStore.get(modelPath)!}
        onMouseMove={() => {
          this.disableIframePointerEvents();
          this.resetHovering = () => setHovering(false);
          setHovering(true);
        }}
      />
    );
  }

  public dispose() {
    if (this.disposed) {
      throw new Error("EngineWithOutput already disposed");
    }
    this.disposed = true;

    this.moduleManagers.forEach((m) => {
      m.forwarder.dispose();
      m.compiler.dispose();
    });

    this.moduleManagers.clear();

    super.dispose();
  }
}
