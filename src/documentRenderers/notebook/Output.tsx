import { ObservableMap, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useRef } from "react";
import ObjectInspector from "react-inspector";
import { TypeCellCodeModel } from "../../models/TypeCellCodeModel";
import { ModelOutput } from "../../typecellEngine/ModelOutput";
import RetryErrorBoundary from "./RetryErrorBoundary";

type Props = {
  model: TypeCellCodeModel;
  outputs: ObservableMap<TypeCellCodeModel, ModelOutput>;
};

// TODO: later maybe also use https://github.com/samdenty/console-feed to capture console messages

const Output: React.FC<Props> = observer((props) => {
  const modelOutput = props.outputs.get(props.model);
  let output = modelOutput?.value;

  let outputJS: any;
  let mainKey: string | undefined = undefined;
  let mainExport: any;
  if (output) {
    outputJS = Object.fromEntries(
      Object.getOwnPropertyNames(output).map((key) => [key, toJS(output[key])])
    );

    if (Object.values(outputJS).length === 1) {
      [mainKey, mainExport] = Object.entries(outputJS)[0];
    } else if (outputJS.hasOwnProperty("default")) {
      mainKey = "default";
      mainExport = outputJS["default"];
    }
  } else {
    output = outputJS = "unevaluated";
  }
  const htmlElementKey = useRef(0);
  try {
    if (mainKey) {
      if (React.isValidElement(mainExport)) {
        return <RetryErrorBoundary>{mainExport}</RetryErrorBoundary>;
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
            <ObjectInspector
              name={mainKey}
              data={mainExport}
              expandLevel={0}></ObjectInspector>
          </span>
        );
      }
    }

    if (output.stack) {
      // TODO: proper error check
      return (
        <span className="outputWrapper">
          <ObjectInspector
            data={output.toString()}
            expandLevel={1}></ObjectInspector>
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
