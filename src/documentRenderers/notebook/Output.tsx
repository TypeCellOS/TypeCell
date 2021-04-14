import { ObservableMap, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useRef } from "react";
import ObjectInspector from "react-inspector";
import ErrorBoundary from "./ErrorBoundary";
import * as monaco from "monaco-editor";


type Props = {
  model: monaco.editor.ITextModel
  outputs: ObservableMap<monaco.editor.ITextModel, any>
};

// TODO: later maybe also use https://github.com/samdenty/console-feed to capture console messages

const Output: React.FC<Props> = observer((props) => {
  let output = props.outputs.get(props.model); // TODO: use context instead of circular reference
  if (output === undefined) {
    output = "unevaluated";
  }
  const previousErrorBoundary = useRef<any>();
  const errorBoundaryKey = useRef(0);
  const htmlElementKey = useRef(0);

  try {
    const outputJS: object = toJS(output);
    const [mainKey, mainExport] =
      Object.values(outputJS).length === 1
        ? Object.entries(outputJS)[0]
        : outputJS.hasOwnProperty("default")
          ? ["default", (outputJS as any)["default"]]
          : [];

    if (mainKey) {
      if (React.isValidElement(mainExport)) {
        if (previousErrorBoundary.current?.hasError()) {
          // make sure we rerender the errorboundary, the previous one had an error state and we want to reset it,
          // because the component "mainExport" might have changed and might not be causing errors anymore
          errorBoundaryKey.current++;
        }
        return (
          <ErrorBoundary key={errorBoundaryKey.current} ref={previousErrorBoundary}>
            {mainExport}
          </ErrorBoundary>
        );
      } else if (mainExport instanceof HTMLElement) {
        return (
          <div
            style={{ display: "contents" }}
            key={htmlElementKey.current++}
            ref={(el) => {
              el && el.appendChild(mainExport);
            }}
          />
        );
      } else {
        return (
          <span className="outputWrapper">
            <ObjectInspector name={mainKey} data={mainExport} expandLevel={0}></ObjectInspector>
          </span>
        );
      }
    }

    if (output.stack) {
      // TODO: proper error check
      return (
        <span className="outputWrapper">
          <ObjectInspector data={output.toString()} expandLevel={1}></ObjectInspector>
        </span>
      );
    } else {
      return (
        <span className="outputWrapper">
          <ObjectInspector data={outputJS} expandLevel={1}></ObjectInspector>
        </span>
      );
    }
  } catch (e) {
    return (
      <span className="outputWrapper">
        <ObjectInspector data={e.toString()} expandLevel={1}></ObjectInspector>
      </span>
    );
  }
});

export default Output;
