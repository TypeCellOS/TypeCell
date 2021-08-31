import { autorun, makeObservable, observable, runInAction } from "mobx";
import { Connection, connectToChild } from "penpal";
import { TypeCellCodeModel } from "../models/TypeCellCodeModel";
import { ContainedElement } from "../util/ContainedElement";
import { Disposable } from "../util/vscode-common/lifecycle";
import OutputShadow from "./OutputShadow";

// use 127.0.0.1 for iframe so that we make sure we run on a different origin
const IFRAME_URL = "http://127.0.0.1:3000/?frame";
let ENGINE_ID = 0;

export default class IframeEngine extends Disposable {
  public readonly iframe: HTMLIFrameElement;
  private disposed: boolean = false;
  private readonly registeredModels = new Set<TypeCellCodeModel>();
  private readonly connection: Connection<any>;
  private connectionMethods: any;

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
  public readonly id = ENGINE_ID++;

  constructor(
    private readonly documentId: string,
    private readonly needsTypesInMonaco: boolean
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
      methods: {
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
      },
    });

    // document.addEventListener("mousemove", (e) => {
    //   this.mousePosition = { x: e.clientX, y: e.clientY };
    // });

    this.initialize().then(
      () => {},
      (e) => {
        console.error(e);
      }
    );
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
    this.connectionMethods = await this.connection.promise;
    console.log("IFrameEngine connection established");
    // const result = await this.connectionMethods.ping();
    // console.log("received", result);

    for (let model of this.registeredModels.values()) {
      await this.connectionMethods.updateModel(
        model.path,
        await model.getCompiledJavascriptCode()
      );
      await this.connectionMethods.updatePositions(
        model.path,
        this.positionCacheStore.get(model.path)!
      );
    }
  }

  /**
   * Register a model to the engine. After registering, the model will be observed for changes and automatically re-evaluated.
   *
   * When the model is disposed (model.dispose()), the model is automatically unregistered.
   * @param model model to register
   */
  public registerModel(model: TypeCellCodeModel) {
    if (this.disposed) {
      throw new Error("registering model on disposed engine");
    }
    if (this.registeredModels.has(model)) {
      console.warn("model already registered"); // TODO: shouldn't happen
      return;
    }
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
    this.registeredModels.add(model);

    // if (this.connectionMethods) {
    //   this.connectionMethods.registerModel(model.path, await model.getCompiledJavascriptCode());
    // }

    let prevValue: string | undefined = model.getValue();

    const evaluate = async () => {
      if (this.connectionMethods) {
        await this.connectionMethods.updateModel(
          model.path,
          await model.getCompiledJavascriptCode()
        );
      }
    };

    this._register(
      model.onDidChangeContent((_event) => {
        if (model.getValue() !== prevValue) {
          // make sure there were actual changes from the previous value

          prevValue = model.getValue();
          evaluate();
        } else {
          // TODO: inspect when this is the case. For initialization it makes sense,
          // but why do we get duplicate events more often?
        }
      })
    );

    let dispose: any;
    evaluate().then(() => {
      // TODO: refactor .then()
      dispose = autorun(() => {
        const positions = { x: positionCache.x, y: positionCache.y };
        if (this.connectionMethods) {
          console.log("send update positions");
          this.connectionMethods.updatePositions(model.path, positions);
        }
      });
    });

    this._register(
      model.onWillDispose(() => {
        this.positionCacheStore.delete(model.path);
        this.dimensionStore.delete(model.path);
        this.registeredModels.delete(model);
        dispose();
        if (this.connectionMethods) {
          this.connectionMethods.deleteModel(model.path);
        }
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
    super.dispose();
  }
}
