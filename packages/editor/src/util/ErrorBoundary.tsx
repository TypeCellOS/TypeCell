import React from "react";

export default class ErrorBoundary extends React.Component<
  { children: any },
  {
    error: any;
    hasError: boolean;
  }
> {
  constructor(props: { children: any }) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    console.error(error);
    return { hasError: true, error };
  }

  public hasError() {
    return this.state.hasError;
  }

  componentDidCatch(_error: any, _errorInfo: any) {
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <strong>Something went wrong: {this.state.error.toString()}</strong>
      );
    }

    return this.props.children;
  }
}
