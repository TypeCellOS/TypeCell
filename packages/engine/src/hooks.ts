// These will be injected in the compiled function and link to hookContext
export const overrideFunctions = [
  "setTimeout",
  "setInterval",
  "console",
  "EventTarget",
  "window",
] as const;

function applyDisposer<T, Y>(
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

export function executeWithHooks<T>(
  modelFunction: (hookContext: any) => Promise<T>
) {
  const disposers: Array<() => void> = [];

  const executeModel = async function (this: any) {
    const hookContext: { [K in typeof overrideFunctions[number]]: any } = {
      setTimeout: applyDisposer(setTimeout, disposers, (ret) => {
        clearTimeout(ret);
      }),
      setInterval: applyDisposer(setInterval, disposers, (ret) => {
        clearInterval(ret);
      }),
      console: {
        ...console,
        log: (...args: any) => {
          // TODO: broadcast output to console view
          console.log(...args);
        },
      },
      EventTarget: undefined,
      window: undefined,
    };

    if (typeof EventTarget !== "undefined") {
      (hookContext.EventTarget as any) = {
        EventTarget,
        prototype: {
          ...EventTarget.prototype,
          addEventListener: applyDisposer(
            EventTarget.prototype.addEventListener as any,
            disposers,
            function (this: any, _ret, args) {
              this.removeEventListener(args[0], args[1]);
            }
          ),
        },
      };
    }

    if (typeof window !== "undefined") {
      hookContext.window = {
        ...window,
        setTimeout: hookContext.setTimeout,
        setInterval: hookContext.setInterval,
        console: hookContext.console,
        EventTarget: hookContext.EventTarget,
      };
    }

    return modelFunction(hookContext);
  };

  return {
    executeModel,
    disposeHooks: () => {
      disposers.forEach((d) => d());
    },
  };
}
