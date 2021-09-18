import { ObservableMap, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import ObjectInspector from "react-inspector";
import { CodeModel } from "@typecell-org/engine";
import { TypeVisualizer } from "../../typecellEngine/lib/exports";
import { ModelOutput } from "../../typecellEngine/ModelOutput";
import { ContainedElement } from "../../util/ContainedElement";
import RetryErrorBoundary from "./RetryErrorBoundary";

// TODO: later maybe also use https://github.com/samdenty/console-feed to capture console messages

function findStyleSheet(node: HTMLStyleElement) {
  for (let i = document.styleSheets.length - 1; i >= 0; i--) {
    if (document.styleSheets.item(i)?.ownerNode === node) {
      return document.styleSheets.item(i)!;
    }
  }
  return undefined;
}

// TODO: clean up props, make more simple / readable
const DefaultVisualizer = (props: {
  mainKey: string | undefined;
  mainExport: any;
  output: any;
  outputJS: any;
}) => {
  const { mainKey, mainExport, output, outputJS } = props;

  const [styleElement, setStyleElement] = useState<CSSStyleSheet | undefined>();

  /**
   * - Adds CSS stylesheet to head
   * - prefixes CSS rules to only affect content in typecell-output
   * - Cleans up CSS Stylesheet on change
   */
  useEffect(() => {
    if (styleElement) {
      styleElement.ownerNode?.remove();
      setStyleElement(undefined);
    }

    if (mainExport instanceof HTMLStyleElement) {
      document.head.appendChild(mainExport);
      const sheet = findStyleSheet(mainExport);
      if (!sheet) {
        throw new Error("css sheet not found");
      }
      // based on: https://stackoverflow.com/a/33237161/194651
      let rules = sheet.cssRules;
      // we loop over all rules
      for (let i = 0; i < rules.length; i++) {
        let rule = rules[i];

        let selector = (rule as any).selectorText;
        let def = rule.cssText.replace(selector, "");

        // we update the selector
        let selector2 = selector.replace(/([^,]+,?)/g, ".typecell-output $1 ");

        sheet.deleteRule(i); // we remove the old
        sheet.insertRule(selector2 + def, i); // we add the new
      }
      setStyleElement(sheet);
    }
  }, [mainExport]);

  if (mainKey) {
    if (React.isValidElement(mainExport)) {
      return (
        <RetryErrorBoundary>
          <div className="typecell-output" style={{ display: "contents" }}>
            {mainExport}
          </div>
        </RetryErrorBoundary>
      );
    } else if (mainExport instanceof HTMLStyleElement) {
      return (
        <span className="outputWrapper">
          <ObjectInspector
            name={mainKey}
            data={styleElement}
            expandLevel={0}></ObjectInspector>
        </span>
      );
    } else if (mainExport instanceof HTMLElement) {
      return (
        <ContainedElement
          className="typecell-output"
          element={mainExport}></ContainedElement>
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
};

type Props = {
  model: CodeModel;
  outputs: ObservableMap<CodeModel, ModelOutput>;
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
    useState<TypeVisualizer<any>>();

  const modelOutput = props.outputs.get(props.model);

  const visualizer =
    selectedVisualizer &&
    modelOutput?.typeVisualizers.find(
      (t) => t.visualizer.name === selectedVisualizer.visualizer.name
    );

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
        mainExport = visualizer.visualizer.function(mainExport);
      } else {
        outputJS = visualizer.visualizer.function(outputJS);
      }
    }

    return (
      <>
        <DefaultVisualizer
          mainExport={mainExport}
          mainKey={mainKey}
          output={output}
          outputJS={outputJS}
        />
        {!!modelOutput?.typeVisualizers.length && (
          <div>
            <button
              title="default"
              style={!selectedVisualizer ? btnStyleActive : btnStyle}
              onClick={() => {
                setSelectedVisualizer(undefined);
              }}>
              Default
            </button>
            {modelOutput?.typeVisualizers.map((tv) => (
              <button
                key={tv.visualizer.name}
                title={tv.visualizer.name}
                className={
                  tv.visualizer.name === selectedVisualizer?.visualizer.name
                    ? "active"
                    : ""
                }
                style={
                  tv.visualizer.name === selectedVisualizer?.visualizer.name
                    ? btnStyleActive
                    : btnStyle
                }
                onClick={() => {
                  setSelectedVisualizer(tv);
                }}>
                {tv.visualizer.name}
              </button>
            ))}
          </div>
        )}
      </>
    );
  } catch (e) {
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
