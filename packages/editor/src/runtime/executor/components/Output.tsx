import { ObservableMap, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import ObjectInspector from "react-inspector";
import { TypeVisualizer } from "../lib/exports";
import { DefaultOutputVisualizer } from "./DefaultOutputVisualizer";
import { ModelOutput } from "./ModelOutput";

type Props = {
  modelPath: string;
  outputs: ObservableMap<string, ModelOutput>;
};

// TODO: later maybe also use https://github.com/samdenty/console-feed to capture console messages

/* Performance / debugging note: this is triggered twice when a cell changes:
    - one time because the output of the cell changes after re-running
    - one time because the variable on the context has been modified

  It will only trigger once when modifying output from another cell ($.outputOtherCell = 3).

  Double render should have neglegible perf impact, so ok for now */

/**
 * The Output component renders the output of a code cell:
 * - DOM elements are rendered directly
 * - React elements are rendered directly
 * - All other values are rendered using ObjectInspector
 */
const Output: React.FC<Props> = observer((props) => {
  const [selectedVisualizer, setSelectedVisualizer] =
    useState<string>();

  const modelOutput = props.outputs.get(props.modelPath);

  const visualizer =
    selectedVisualizer &&
    modelOutput?.typeVisualizers.get(selectedVisualizer)?.visualizer

  let output = modelOutput?.value;

  let outputJS: any;
  let mainKey: string | undefined = undefined;
  let mainExport: any;
  if (output) {
    /*
    Find the main export to visualize:
    - default if there is a default export
    - else, the single export if there is only one named export
    - else, the object with all exports
    */
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

  try {
    if (visualizer) {
      if (mainKey) {
        mainExport = visualizer.function(mainExport);
      } else {
        outputJS = visualizer.function(outputJS);
      }
    }

    return (
      <>
        <DefaultOutputVisualizer
          mainExport={mainExport}
          mainKey={mainKey}
          output={output}
          outputJS={outputJS}
        />
        {!!modelOutput?.typeVisualizers.size && (
          <div>
            <button
              title="default"
              style={!visualizer ? btnStyleActive : btnStyle}
              onClick={() => {
                setSelectedVisualizer(undefined);
              }}>
              Default
            </button>
            {Array.from(modelOutput?.typeVisualizers.entries()).map(([key, obj]) => (
              <button
                key={key}
                title={obj.visualizer.name}
                className={
                  key === selectedVisualizer
                    ? "active"
                    : ""
                }
                style={
                  key === selectedVisualizer
                    ? btnStyleActive
                    : btnStyle
                }
                onClick={() => {
                  setSelectedVisualizer(key);
                }}>
                {obj.visualizer.name}
              </button>
            ))}
          </div>
        )}
      </>
    );
  } catch (e: any) {
    return (
      <span className="outputWrapper">
        <ObjectInspector data={e.toString()} expandLevel={1}></ObjectInspector>
      </span>
    );
  }
});

const btnStyle = {
  border: 0,
  position: "relative" as "relative",
  bottom: -10,
  left: -10,
  background: "none",
};

const btnStyleActive = {
  ...btnStyle,
  textDecoration: "underline" as "underline",
};

export default Output;
