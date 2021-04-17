import { ObservableMap, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useRef } from "react";
import ObjectInspector from "react-inspector";
import ErrorBoundary from "./ErrorBoundary";
import * as monaco from "monaco-editor";
import RetryErrorBoundary from "./RetryErrorBoundary";


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
        return (
          <RetryErrorBoundary>
            {mainExport}
          </RetryErrorBoundary>
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
