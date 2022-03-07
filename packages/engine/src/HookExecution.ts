const glob = typeof window === "undefined" ? global : window;

const overrideFunctions = [
  "setTimeout",
  "setInterval",
  "console",
  "EventTarget.prototype.addEventListener",
] as const;

const originalReferences: HookContext = {
  setTimeout: glob.setTimeout,
  setInterval: glob.setInterval,
  console: glob.console,
  "EventTarget.prototype.addEventListener":
    glob.EventTarget.prototype.addEventListener,
};

export type HookContext = { [K in typeof overrideFunctions[number]]: any };

function setProperty(base: Object, path: string, value: any) {
  const layers = path.split(".");
  if (layers.length > 1) {
    const toOverride = layers.pop()!;
    // Returns second last path member
    const layer = layers.reduce((o, i) => o[i], base as any);
    layer[toOverride] = value;
  } else {
    (base as any)[path] = value;
  }
}

export class HookExecution {
  public disposers: Array<() => void> = [];
  public context: HookContext = {
    setTimeout: this.createHookedFunction(setTimeout, this.disposers, (ret) => {
      clearTimeout(ret);
    }),
    setInterval: this.createHookedFunction(
      setInterval,
      this.disposers,
      (ret) => {
        clearInterval(ret);
      }
    ),
    console: {
      ...originalReferences.console,
      log: (...args: any) => {
        // TODO: broadcast output to console view
        originalReferences.console.log(...args);
      },
    },
    ["EventTarget.prototype.addEventListener"]: undefined,
  };

  constructor() {
    if (typeof EventTarget !== "undefined") {
      this.context["EventTarget.prototype.addEventListener"] =
        this.createHookedFunction(
          EventTarget.prototype.addEventListener as any,
          this.disposers,
          function (this: any, _ret, args) {
            this.removeEventListener(args[0], args[1]);
          }
        );
    }
  }

  public attachToWindow() {
    overrideFunctions.forEach((path) =>
      setProperty(glob, path, this.context[path])
    );
  }

  public detachFromWindow() {
    overrideFunctions.forEach((path) =>
      setProperty(glob, path, originalReferences[path])
    );
  }

  public dispose() {
    this.disposers.forEach((d) => d());
  }

  private createHookedFunction<T, Y>(
    original: (...args: T[]) => Y,
    disposes: Array<() => void>,
    disposer: (ret: Y, args: T[]) => void
  ) {
    return function newFunction(this: any): Y {
      const callerArguments = arguments;
      const ret = original.apply(this, callerArguments as any); // TODO: fix any?
      const ctx = this;
      disposes.push(() => disposer.call(ctx, ret, callerArguments as any));
      return ret;
    };
  }
}
