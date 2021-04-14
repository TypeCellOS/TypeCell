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
    unHook: () => {
      obj[method] = originalFunction;
    },
  };
}

export function installHooks() {
  const hooks: Hook[] = [];
  hooks.push(installHook(window, "setTimeout", (ret) => clearTimeout(ret)));
  hooks.push(installHook(window, "setInterval", (ret) => clearInterval(ret)));
  hooks.push(
    installHook(EventTarget.prototype, "addEventListener", function (this: any, ret, args: IArguments) {
      this.removeEventListener(args[0], args[1]);
    })
  );

  return {
    disposeAll: () => {
      hooks.forEach((h) => h.disposeAll());
    },
    unHookAll: () => {
      hooks.forEach((h) => h.unHook());
    },
  };
}
