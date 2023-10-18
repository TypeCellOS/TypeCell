import Form, { FormSection } from "@atlaskit/form";
import { observer } from "mobx-react-lite";
import React from "react";
import { FormField } from "./FormField";
import { Settings } from "./types";

export type AutoFormProps<
  T extends {
    [key: string]: unknown;
  },
> = {
  inputObject: T;
  fields: {
    [key in keyof T as string]: boolean;
  };
  settings: Settings;
  setSetting: (key: string, value: any) => void;
};
export const AutoForm = observer(
  <
    T extends {
      [key: string]: unknown;
    },
  >(
    props: AutoFormProps<T>,
  ) => {
    // const [settings, setSettings] = React.useState({} as Settings);
    console.log("settings", JSON.stringify(props.settings));
    return (
      <div
        style={{
          display: "flex",
          maxWidth: "400px",
          margin: "20px auto 20px auto",
          flexDirection: "column",
        }}>
        <Form
          onSubmit={(data) => {
            return;
          }}>
          {({ formProps }) => (
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
                {Object.keys(props.fields).map((input: string) => {
                  return (
                    <FormField
                      key={input}
                      inputObject={props.inputObject as any}
                      fieldKey={input}
                      // modelPath={props.modelPath}
                      value={props.settings[input]}
                      setValue={(value: string | undefined) => {
                        props.setSetting(input, value);
                      }}
                    />
                  );
                })}
              </FormSection>
            </form>
          )}
        </Form>
      </div>
    );
  },
);
