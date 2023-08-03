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
      console.log("cleanup");
      val.current![1]();
      val.current = undefined;
    };
  }, deps);

  return useSyncExternalStore(subscribe, () => {
    if (!val.current) {
      val.current = allocateResource();
    }
    return val.current![0];
  });
}
