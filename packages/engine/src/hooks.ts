const glob = typeof window === "undefined" ? global : window;

// These will be injected in the compiled function and link to hookContext
export const overrideFunctions = [
  "setTimeout",
  "setInterval",
  "console",
  "EventTarget",
];

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
    const hookContext = {
      setTimeout: applyDisposer(setTimeout, disposers, (ret) => {
        clearTimeout(ret);
      }),
      setInterval: applyDisposer(setInterval, disposers, (ret) => {
        clearInterval(ret);
      }),
      console: {
        ...glob.console,
        log: () => {
          // TODO: broadcast output to console view
        },
      },
      EventTarget: undefined,
    };

    if (typeof EventTarget !== "undefined") {
      (hookContext.EventTarget as any) = {
        ...glob.EventTarget,
        prototype: {
          ...glob.EventTarget.prototype,
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

    return modelFunction(hookContext);
  };

  return {
    executeModel,
    disposeHooks: () => {
      disposers.forEach((d) => d());
    },
  };
}
