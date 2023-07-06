import Button from "@atlaskit/button";
import TextField from "@atlaskit/textfield";
import { ObservableMap, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { Fragment } from "react";
import { ObjectInspector } from "react-inspector";
import { ModelOutput } from "./ModelOutput";

import Form, { Field, FormSection, HelperMessage } from "@atlaskit/form";
import { VscArrowCircleUp, VscCode } from "react-icons/vsc";
import MonacoEdit from "./MonacoEdit";

type Props = {
  modelPath: string;
  outputs: ObservableMap<string, ModelOutput>;
  code: string;
  bindings: string;
  setBindings: (bindings: string) => void;
  setCode: (code: string) => void;
  objKey: string;
};

function getCodeFromBindings(
  bindings: any,
  docUrl: string,
  objName: string
): string {
  const autoruns = Object.entries(bindings)
    .map(([key, value]) => {
      if (typeof value === "string") {
        return `autorun(() => {
doc.${key} = ${value};
});`;
      }
      return undefined;
    })
    .filter((x) => x);

  return `// @default-collapsed
import * as doc from "${docUrl}";

${autoruns.join("\n\n")}

export default {
block: doc.${objName},
doc,
};`;
}

const FormField = observer(
  (props: {
    mainExport: any;
    inputKey: string;
    modelPath: string;
    bindings: any;
    setBindings: (bindings: string) => void;
    setCode: (code: string) => void;
    objKey: string;
  }) => {
    console.log("element bindings", props.bindings);
    let [showCode, setShowCode] = React.useState(false);
    const { mainExport, inputKey } = props;
    const currentValue = mainExport.doc[inputKey];

    let currentBinding = props.bindings[inputKey];
    let currentParsedBinding: string | number | undefined;

    if (currentBinding) {
      try {
        // remove trailing ;
        currentBinding = currentBinding.replace(/;$/, "");
        let parsed = JSON.parse(currentBinding);
        if (typeof parsed === "string" || typeof parsed === "number") {
          currentParsedBinding = parsed;
        }
      } catch (e) {}
    }

    const canUseInput =
      typeof currentParsedBinding !== "undefined" ||
      (typeof currentBinding === "undefined" &&
        (typeof currentValue === "string" || typeof currentValue === "number"));

    showCode = showCode || !canUseInput;

    const code = `${currentBinding};`;

    return (
      <Field name={inputKey} label={inputKey}>
        {({ fieldProps, error }) => (
          <Fragment>
            <div style={{ display: "flex" }}>
              {showCode ? (
                <MonacoEdit
                  code={code}
                  onChange={(code) => {
                    // remove trailing ;
                    code = code.replace(/;$/, "");
                    const bindings = {
                      ...props.bindings,
                      [inputKey]: code,
                    };
                    props.setBindings(JSON.stringify(bindings));
                    props.setCode(
                      getCodeFromBindings(
                        bindings,
                        props.mainExport.doc.__moduleName,
                        props.objKey
                      )
                    );
                  }}
                  documentid={props.modelPath}
                />
              ) : (
                <TextField
                  autoComplete="off"
                  {...fieldProps}
                  value={currentParsedBinding || ""}
                  onChange={(e) => {
                    const bindings = {
                      ...props.bindings,
                      [inputKey]: JSON.stringify((e.target as any).value),
                    };
                    props.setBindings(JSON.stringify(bindings));
                    props.setCode(
                      getCodeFromBindings(
                        bindings,
                        props.mainExport.doc.__moduleName,
                        props.objKey
                      )
                    );
                  }}

                  // elemAfterInput={<VscCode />}
                />
              )}
              <Button
                isSelected={showCode}
                isDisabled={!canUseInput}
                onClick={() => setShowCode(!showCode)}
                style={{ height: "auto" }}
                iconBefore={<VscCode size={20} />}></Button>
            </div>
            {!error && (
              <HelperMessage>
                <Button
                  // onClick={() => setShowCode(!showCode)}
                  style={{ height: "auto" }}
                  appearance="subtle-link"
                  iconBefore={<VscArrowCircleUp size={18} />}></Button>
                Current: {JSON.stringify(currentValue)}{" "}
              </HelperMessage>
            )}
            {/* {error && (
            <ErrorMessage>
              This username is already in use, try another one.
            </ErrorMessage>
          )} */}
          </Fragment>
        )}
      </Field>
    );
  }
);

const EditArea: React.FC<Props> = observer((props) => {
  const modelOutput = props.outputs.get(props.modelPath);

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

  if (!mainExport) {
    return <></>;
  }

  if (!mainExport.block?.inputs) {
    return <></>;
    // throw new Error("mainExport.block is undefined");
  }

  const bindings = props.bindings?.length ? JSON.parse(props.bindings) : {};

  try {
    return (
      <div
        style={{
          display: "flex",
          maxWidth: "400px",
          margin: "20px auto 20px auto",
          flexDirection: "column",
        }}>
        <Form<{ username: string; password: string; remember: boolean }>
          onSubmit={(data) => {}}>
          {({ formProps, submitting }) => (
            <form {...formProps}>
              <p style={{ marginBottom: "-30px" }}>
                Set properties of component:
              </p>
              {/* <FormHeader title="variables">
              </FormHeader> */}
              {/* <FormHeader title="variables">
              <p aria-hidden="true">Edit variables</p>
            </FormHeader> */}
              <FormSection>
                {mainExport.block.inputs.map((input: string) => {
                  return (
                    <FormField
                      key={input}
                      objKey={props.objKey}
                      modelPath={props.modelPath}
                      inputKey={input}
                      mainExport={mainExport}
                      bindings={bindings}
                      setBindings={props.setBindings}
                      setCode={props.setCode}
                    />
                  );
                })}
                {/* <Field
              aria-required={true}
              name="password"
              label="Password"
              defaultValue=""
              isRequired
              validate={(value) =>
                value && value.length < 8 ? 'TOO_SHORT' : undefined
              }
            >
              {({ fieldProps, error, valid, meta }) => {
                return (
                  <Fragment>
                    <TextField type="password" {...fieldProps} />
                    {error && !valid && (
                      <HelperMessage>
                        Use 8 or more characters with a mix of letters, numbers
                        and symbols.
                      </HelperMessage>
                    )}
                    {error && (
                      <ErrorMessage>
                        Password needs to be more than 8 characters.
                      </ErrorMessage>
                    )}
                    {valid && meta.dirty ? (
                      <ValidMessage>Awesome password!</ValidMessage>
                    ) : null}
                  </Fragment>
                );
              }}
            </Field> */}
              </FormSection>

              {/* <FormFooter>
            <ButtonGroup>
              <Button appearance="subtle">Cancel</Button>
              <LoadingButton
                type="submit"
                appearance="primary"
                isLoading={submitting}
              >
                Sign up
              </LoadingButton>
            </ButtonGroup>
          </FormFooter> */}
            </form>
          )}
        </Form>
      </div>

      // <>
      //   {mainExport.block.inputs.map((input: string) => {
      //     return (
      //       <div>
      //         {input}: {JSON.stringify(mainExport.doc[input]) + ""}
      //         <MonacoEdit documentid={props.modelPath} />
      //       </div>
      //     );
      //   })}
      // </>
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

export default EditArea;
