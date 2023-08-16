/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObservableMap, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { ObjectInspector } from "react-inspector";
import { DefaultOutputVisualizer } from "./DefaultOutputVisualizer";
import { ModelOutput } from "./ModelOutput";
import { OutputWrapper } from "./OutputWrapper";

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
  const [selectedVisualizer, setSelectedVisualizer] = useState<string>();

  const modelOutput = props.outputs.get(props.modelPath);

  const visualizer =
    selectedVisualizer &&
    modelOutput?.typeVisualizers.get(selectedVisualizer)?.visualizer;

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
      // eslint-disable-next-line no-prototype-builtins
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
        mainExport = visualizer.func(mainExport);
      } else {
        outputJS = visualizer.func(outputJS);
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
            {Array.from(modelOutput?.typeVisualizers.entries()).map(
              ([key, obj]) => (
                <button
                  key={key}
                  className={key === selectedVisualizer ? "active" : ""}
                  style={key === selectedVisualizer ? btnStyleActive : btnStyle}
                  onClick={() => {
                    setSelectedVisualizer(key);
                  }}>
                  {obj.visualizer?.name || key}
                </button>
              )
            )}
          </div>
        )}
      </>
    );
  } catch (e: any) {
    return (
      <OutputWrapper>
        <ObjectInspector data={e.toString()} expandLevel={1}></ObjectInspector>
      </OutputWrapper>
    );
  }
});

const btnStyle = {
  border: 0,
  position: "relative" as const,
  bottom: -10,
  left: -10,
  background: "none",
};

const btnStyleActive = {
  ...btnStyle,
  textDecoration: "underline" as const,
};

export default Output;
