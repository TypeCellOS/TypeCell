import { ConsolePayload } from "./Engine";

const glob = typeof window === "undefined" ? global : window;

// These functions will be added to the scope of the cell
const onScopeFunctions = ["setTimeout", "setInterval", "console"] as const;

// These functions will be attached to the window during cell execution
const onWindowFunctions = [
  ...onScopeFunctions,
  "EventTarget.prototype.addEventListener",
] as const;

export const originalReferences: ScopeHooks & WindowHooks = {
  setTimeout: glob.setTimeout,
  setInterval: glob.setInterval,
  console: glob.console,
  "EventTarget.prototype.addEventListener":
    glob.EventTarget.prototype.addEventListener,
};

export type ScopeHooks = { [K in typeof onScopeFunctions[number]]: any };

export type WindowHooks = { [K in typeof onWindowFunctions[number]]: any };

/**
 * Sets object property based on a given path and value.
 * E.g. path could be level1.level2.prop
 */
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
  public scopeHooks: ScopeHooks = {
    setTimeout: this.createHookedFunction(setTimeout, (ret) => {
      clearTimeout(ret);
    }),
    setInterval: this.createHookedFunction(setInterval, (ret) => {
      clearInterval(ret);
    }),
    console: {
      ...originalReferences.console,
      log: (...args: any) => {
        this.onConsoleEvent({
          level: "info",
          arguments: args,
        });
      },
      info: (...args: any) => {
        this.onConsoleEvent({
          level: "info",
          arguments: args,
        });
      },
      warn: (...args: any) => {
        this.onConsoleEvent({
          level: "warn",
          arguments: args,
        });
      },
      error: (...args: any) => {
        this.onConsoleEvent({
          level: "error",
          arguments: args,
        });
      },
    },
  };

  public windowHooks: WindowHooks = {
    ...this.scopeHooks,
    ["EventTarget.prototype.addEventListener"]: undefined,
  };

  constructor(private onConsoleEvent: (console: ConsolePayload) => void) {
    if (typeof EventTarget !== "undefined") {
      this.windowHooks["EventTarget.prototype.addEventListener"] =
        this.createHookedFunction(
          EventTarget.prototype.addEventListener as any,
          function (this: any, _ret, args) {
            this.removeEventListener(args[0], args[1]);
          }
        );
    }
  }

  public attachToWindow() {
    onWindowFunctions.forEach((path) =>
      setProperty(glob, path, this.windowHooks[path])
    );
  }

  public detachFromWindow() {
    onWindowFunctions.forEach((path) =>
      setProperty(glob, path, originalReferences[path])
    );
  }

  public dispose() {
    this.disposers.forEach((d) => d());
  }

  private createHookedFunction<T, Y>(
    original: (...args: any[]) => Y,
    disposer: (ret: Y, args: T[]) => void
  ) {
    const self = this;
    return function newFunction(this: any): Y {
      const callerArguments = arguments;
      const ret = original.apply(this, callerArguments as any); // TODO: fix any?
      const ctx = this;
      self.disposers.push(() =>
        disposer.call(ctx, ret, callerArguments as any)
      );
      return ret;
    };
  }
}
