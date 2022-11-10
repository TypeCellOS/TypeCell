import { useRef } from "react";
import ErrorBoundary from "./ErrorBoundary";

/**
 * An ErrorBoundary that will still rerender on the next render cycle, when an error has occured in the previous cycle
 */
export default function RetryErrorBoundary(props: { children: any }) {
  const previousErrorBoundary = useRef<any>();
  const errorBoundaryKey = useRef(0);

  if (previousErrorBoundary.current?.hasError()) {
    // make sure we rerender the errorboundary, the previous one had an error state and we want to reset it,
    // because the props.children might have changed and might not be causing errors anymore
    errorBoundaryKey.current++;
  }

  return (
    <ErrorBoundary key={errorBoundaryKey.current} ref={previousErrorBoundary}>
      {props.children}
    </ErrorBoundary>
  );
}
