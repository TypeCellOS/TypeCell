import {
  DependencyList,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";

// see https://twitter.com/YousefED/status/1686977115156033536
export function useResource<T>(
  allocateResource: () => [T, () => void],
  deps: DependencyList
) {
  const val = useRef<[T, () => void]>();

  const subscribe = useCallback(() => {
    return () => {
      if (!val.current) {
        throw new Error("unexpected, no currentval when unsubscribing");
      }
      val.current[1]();
      val.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return useSyncExternalStore(subscribe, () => {
    if (!val.current) {
      val.current = allocateResource();
    }
    return val.current[0];
  });
}
