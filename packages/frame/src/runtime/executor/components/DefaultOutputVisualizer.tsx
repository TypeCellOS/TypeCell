/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ContainedElement, RetryErrorBoundary } from "@typecell-org/util";
import React, { useEffect, useState } from "react";
import { ObjectInspector } from "react-inspector";
import { OutputWrapper } from "./OutputWrapper";

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
export const DefaultOutputVisualizer = (props: {
  mainKey: string | undefined;
  mainExport: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output: any;
  outputJS: unknown;
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
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (sheet) => sheet !== styleElement,
      );
    }

    if (
      mainExport instanceof HTMLStyleElement ||
      mainExport instanceof CSSStyleSheet
    ) {
      let sheet = mainExport;

      if (sheet instanceof HTMLStyleElement) {
        document.head.appendChild(sheet);
        const foundSheet = findStyleSheet(sheet);
        if (!foundSheet) {
          throw new Error("css sheet not found");
        }
        sheet = foundSheet;
      } else {
        // add CSSSTyleSheet sheet to document
        document.adoptedStyleSheets.push(sheet);
      }
      // based on: https://stackoverflow.com/a/33237161/194651
      const rules = sheet.cssRules;
      // we loop over all rules
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (rule instanceof CSSStyleRule) {
          const selector = rule.selectorText;
          const def = rule.cssText.replace(selector, "");

          // we update the selector
          const selector2 = selector.replace(
            /([^,]+,?)/g,
            ".typecell-output $1 ",
          );

          sheet.deleteRule(i); // we remove the old
          sheet.insertRule(selector2 + def, i); // we add the new
        }
      }
      setStyleElement(sheet);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainExport]);

  if (mainKey) {
    if (React.isValidElement(mainExport)) {
      console.log("render export", mainExport);
      return (
        <RetryErrorBoundary>
          <div className="typecell-output" style={{ display: "contents" }}>
            {mainExport}
          </div>
        </RetryErrorBoundary>
      );
    } else if (mainExport instanceof HTMLStyleElement) {
      return (
        <OutputWrapper>
          <ObjectInspector
            name={mainKey}
            data={styleElement}
            expandLevel={0}></ObjectInspector>
        </OutputWrapper>
      );
    } else if (
      mainExport instanceof HTMLElement ||
      mainExport instanceof SVGElement
    ) {
      return (
        <ContainedElement
          className="typecell-output"
          element={mainExport}></ContainedElement>
      );
    } else {
      return (
        <OutputWrapper>
          <ObjectInspector
            name={mainKey}
            data={mainExport}
            expandLevel={0}></ObjectInspector>
        </OutputWrapper>
      );
    }
  }

  if (output.stack) {
    // TODO: proper error check
    return (
      <OutputWrapper>
        <ObjectInspector
          data={output.toString()}
          expandLevel={1}></ObjectInspector>
      </OutputWrapper>
    );
  } else {
    return (
      <OutputWrapper>
        <ObjectInspector data={outputJS} expandLevel={1}></ObjectInspector>
      </OutputWrapper>
    );
  }
};
