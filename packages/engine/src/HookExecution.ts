import { ConsolePayload } from "./Engine";

const glob = typeof window === "undefined" ? global : window;

const overrideFunctions = [
  "setTimeout",
  "setInterval",
  "console",
  "EventTarget",
  "window",
  "global",
] as const;

const originalReferences: HookContext = {
  setTimeout: glob.setTimeout,
  setInterval: glob.setInterval,
  console: glob.console,
  EventTarget: glob.EventTarget,
  window: window,
  global: global,
};

export type HookContext = { [K in typeof overrideFunctions[number]]: any };

export class HookExecution {
  public disposers: Array<() => void> = [];
  public context: HookContext = {
    setTimeout: this.applyDisposer(setTimeout, (ret) => {
      clearTimeout(ret);
    }),
    setInterval: this.applyDisposer(setInterval, (ret) => {
      clearInterval(ret);
    }),
    console: {
      ...originalReferences.console,
      log: (...args: any) => {
        originalReferences.console.log(...args);
        this.onConsoleEvent({
          level: "info",
          message: args,
        });
      },
      info: (...args: any) => {
        originalReferences.console.info(...args);
        this.onConsoleEvent({
          level: "info",
          message: args,
        });
      },
      warn: (...args: any) => {
        originalReferences.console.warn(...args);
        this.onConsoleEvent({
          level: "warn",
          message: args,
        });
      },
      error: (...args: any) => {
        originalReferences.console.error(...args);
        this.onConsoleEvent({
          level: "error",
          message: args,
        });
      },
    },
    EventTarget: undefined,
    window: undefined,
    global: undefined,
  };

  constructor(private onConsoleEvent: (console: ConsolePayload) => void) {
    if (typeof EventTarget !== "undefined") {
      this.context.EventTarget = {
        EventTarget,
        prototype: {
          ...EventTarget.prototype,
          addEventListener: this.applyDisposer(
            EventTarget.prototype.addEventListener as any,
            function (this: any, _ret, args) {
              this.removeEventListener(args[0], args[1]);
            }
          ),
        },
      };
    }

    if (typeof window !== "undefined") {
      this.context.window = {
        ...window,
        setTimeout: this.context.setTimeout,
        setInterval: this.context.setInterval,
        console: this.context.console,
        EventTarget: this.context.EventTarget,
      };
    }

    if (typeof global !== "undefined") {
      this.context.global = {
        ...global,
        setTimeout: this.context.setTimeout,
        setInterval: this.context.setInterval,
        console: this.context.console,
        EventTarget: this.context.EventTarget,
      };
    }
  }

  public attachToWindow() {
    overrideFunctions
      .filter((name) => name !== "window" && name !== "global")
      .forEach((name) => {
        (glob as any)[name] = this.context[name];
      });
  }

  public detachFromWindow() {
    overrideFunctions
      .filter((name) => name !== "window" && name !== "global")
      .forEach((name) => {
        (glob as any)[name] = originalReferences[name];
      });
  }

  public dispose() {
    this.disposers.forEach((d) => d());
  }

  private applyDisposer<T, Y>(
    original: (...args: T[]) => Y,
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
