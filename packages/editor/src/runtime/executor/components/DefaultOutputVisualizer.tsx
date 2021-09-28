import React, { useEffect, useState } from "react";
import ObjectInspector from "react-inspector";
import { ContainedElement } from "../../../util/ContainedElement";
import RetryErrorBoundary from "../../../util/RetryErrorBoundary";

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