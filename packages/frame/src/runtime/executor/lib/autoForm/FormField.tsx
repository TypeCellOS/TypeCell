import Button from "@atlaskit/button";
import TextField from "@atlaskit/textfield";
import { observer } from "mobx-react-lite";
import React, { Fragment } from "react";

import DropdownMenu, {
  DropdownItem,
  DropdownItemRadio,
  DropdownItemRadioGroup,
} from "@atlaskit/dropdown-menu";
import { Field, HelperMessage } from "@atlaskit/form";
import { VscArrowCircleUp, VscEllipsis } from "react-icons/vsc";
import MonacoEdit from "./MonacoEdit";

export const FormField = observer(
  <T extends string | boolean | number, Key extends string>(props: {
    inputObject: {
      [key in Key]: T;
    } & {
      [key: string]: unknown;
    };
    fieldKey: Key;
    // modelPath: string;
    value: string | undefined;
    setValue: (value: string | undefined) => void;
  }) => {
    const [showCode, setShowCode] = React.useState(false);
    const { inputObject, fieldKey } = props;
    const currentValue = inputObject[fieldKey];

    let currentStringified = "<complex object>";

    try {
      currentStringified = JSON.stringify(currentValue);
    } catch (e) {
      // noop
    }

    let currentParsedBinding: string | number | undefined;

    if (props.value !== undefined) {
      try {
        // remove trailing ;
        let code = props.value.replace(/;$/, "");
        code = code.replace(/^export default /, "");
        const parsed = JSON.parse(code);
        if (typeof parsed === "string" || typeof parsed === "number") {
          currentParsedBinding = parsed;
        }
      } catch (e) {
        // ignore
      }
    }

    const canUseInput =
      props.value === undefined || currentParsedBinding !== undefined;

    let inputField: React.ReactNode = <div>Unsupported type</div>;

    const realShowCode = showCode || !canUseInput;

    if (canUseInput) {
      const valueType =
        currentParsedBinding === undefined
          ? typeof currentValue
          : typeof currentParsedBinding;

      if (valueType === "string") {
        inputField = (
          <TextField
            placeholder="<not set>"
            autoComplete="off"
            // {...fieldProps}
            value={currentParsedBinding || ""}
            onChange={(e) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const newVal = (e.target as any).value;
              if (newVal === "") {
                props.setValue(undefined);
                return;
              }
              props.setValue(`export default ${JSON.stringify(newVal)};`);
            }}
          />
        );
      } else if (valueType === "number") {
        inputField = (
          <TextField
            placeholder="<not set>"
            autoComplete="off"
            // {...fieldProps}
            type="number"
            value={currentParsedBinding || ""}
            onChange={(e) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const newVal = (e.target as any).value;

              if (newVal === "") {
                props.setValue(undefined);
                return;
              }

              props.setValue(
                `export default ${JSON.stringify(parseFloat(newVal))};`,
              );
            }}
          />
        );
      }
    }

    return (
      <Field name={fieldKey} label={fieldKey}>
        {({ fieldProps, error }) => (
          <Fragment>
            <div style={{ display: "flex" }}>
              {realShowCode ? (
                <MonacoEdit
                  value={props.value || "export default"}
                  documentid={"TODO"}
                  onChange={(newValue) => {
                    if (!newValue || newValue.trim() === "export default") {
                      props.setValue(undefined);
                      return;
                    }

                    props.setValue(newValue);
                  }}
                />
              ) : (
                inputField
              )}

              <DropdownMenu
                spacing="compact"
                trigger={({ triggerRef, ...props }) => (
                  <Button
                    // isSelected={showCode}
                    // isDisabled={!canUseInput}
                    ref={triggerRef}
                    style={{ height: "auto" }}
                    iconBefore={<VscEllipsis size={20} />}
                    {...props}></Button>
                )}>
                <DropdownItem
                  onClick={() => {
                    props.setValue(undefined);
                    setShowCode(false);
                  }}>
                  Clear value
                </DropdownItem>
                <DropdownItemRadioGroup title="Views" id="actions">
                  <DropdownItemRadio
                    id="value"
                    onClick={() => setShowCode(false)}
                    isSelected={!realShowCode}
                    isDisabled={!canUseInput}>
                    Value view
                  </DropdownItemRadio>
                  <DropdownItemRadio
                    id="code"
                    onClick={() => setShowCode(true)}
                    isSelected={realShowCode}>
                    Code view
                  </DropdownItemRadio>
                </DropdownItemRadioGroup>
              </DropdownMenu>
            </div>
            <HelperMessage>
              <Button
                onClick={() => {
                  props.setValue(`export default ${currentStringified}`);
                }}
                style={{ height: "auto" }}
                appearance="subtle-link"
                iconBefore={<VscArrowCircleUp size={18} />}></Button>
              Current: {currentStringified}
            </HelperMessage>
          </Fragment>
        )}
      </Field>
    );
  },
);
