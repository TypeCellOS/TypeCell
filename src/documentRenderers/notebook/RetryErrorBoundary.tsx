import React, { useRef } from "react";
import ErrorBoundary from "./ErrorBoundary";

/**
 * An ErrorBoundary that will still rerender on the next render cycle, when an error has occured in the previous cycle
 */
export default function RetryErrorBoundary(props: { children: any }) {
  const previousErrorBoundary = useRef<any>();
  const errorBoundaryKey = useRef(0);

  return <ErrorBoundary key={errorBoundaryKey.current} ref={previousErrorBoundary}>
    {props.children}
  </ErrorBoundary>

}
