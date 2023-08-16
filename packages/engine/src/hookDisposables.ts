/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type Hook = {
  disposeAll: () => void;
  unHook: () => void;
};

function installHook<T, K extends FunctionPropertyNames<T>>(
  obj: T,
  method: K,
  disposeSingle: (ret: ReturnType<any>, args: IArguments) => void // TODO: fix any
): Hook {
  const disposes: Array<() => void> = [];

  const originalFunction = obj[method];
  (obj[method] as any) = function (this: any) {
    const args = arguments;
    const ret = (originalFunction as any).apply(this, args); // TODO: fix any?
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const ctx = this;
    disposes.push(() => disposeSingle.call(ctx, ret, args));
    return ret;
  };

  return {
    disposeAll: () => {
      disposes.forEach((d) => d());
    },
    unHook: () => {
      obj[method] = originalFunction;
    },
  };
}

const wnd = typeof window === "undefined" ? global : window;

export function installHooks() {
  const hooks: Hook[] = [];
  hooks.push(installHook(wnd, "setTimeout", (ret) => clearTimeout(ret as any)));
  hooks.push(
    installHook(wnd, "setInterval", (ret) => clearInterval(ret as any))
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
    unHookAll: () => {
      hooks.forEach((h) => h.unHook());
    },
  };
}
