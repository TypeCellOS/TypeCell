type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type Hook = {
  disposeAll: () => void;
};

const glob = typeof window === "undefined" ? global : window;

function globalFunctionOverride(
  method: string,
  disposes: Array<() => void>,
  disposer: (ret: any, args: IArguments) => void
) {
  const originalFunction = (glob as any)[method];

  return function (this: any) {
    const args = arguments;
    const ret = (originalFunction as any).apply(this, args); // TODO: fix any?
    const ctx = this;
    disposes.push(() => disposer.call(ctx, ret, args));
    return ret;
  };
}

export function executeWithHooks<T>(
  execution: () => T,
  disposers: Array<() => void>
) {
  const execute = () => {
    // manipulate execution scope
    (setTimeout as any) = globalFunctionOverride(
      "setTimeout",
      disposers,
      (ret) => {
        console.log("DISPOSING");
        clearTimeout(ret as any);
      }
    );
    (setInterval as any) = globalFunctionOverride(
      "setInterval",
      disposers,
      (ret) => {
        console.log("DISPOSING interval yo");
        clearInterval(ret as any);
      }
    );

    const executionPromise = execution();
    return executionPromise;
  };

  console.log(disposers);

  return {
    execute,
  };
}

function installHook<T, K extends FunctionPropertyNames<T>>(
  obj: T,
  method: K,
  disposeSingle: (ret: ReturnType<T[K]>, args: IArguments) => void
): Hook {
  const disposes: Array<() => void> = [];

  const originalFunction = obj[method];
  (obj[method] as any) = function (this: any) {
    const args = arguments;
    const ret = (originalFunction as any).apply(this, args); // TODO: fix any?
    const ctx = this;
    disposes.push(() => disposeSingle.call(ctx, ret, args));
    return ret;
  };

  return {
    disposeAll: () => {
      disposes.forEach((d) => d());
    },
  };
}

export function installHooks() {
  const hooks: Hook[] = [];
  hooks.push(
    installHook(glob, "setTimeout", (ret) => clearTimeout(ret as any))
  );
  hooks.push(
    installHook(glob, "setInterval", (ret) => clearInterval(ret as any))
  );

  if (typeof EventTarget !== "undefined") {
    hooks.push(
      installHook(
        EventTarget.prototype,
        "addEventListener",
        function (this: any, ret, args: IArguments) {
          this.removeEventListener(args[0], args[1]);
        }
      )
    );
  }

  return {
    disposeAll: () => {
      hooks.forEach((h) => h.disposeAll());
    },
  };
}
