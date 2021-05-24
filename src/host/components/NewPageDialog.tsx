import React, { useCallback, useState } from "react";

import Button from "@atlaskit/button/standard-button";
import { ErrorMessage, Field } from "@atlaskit/form";
import Textfield from "@atlaskit/textfield";

import Modal, {
  ContainerComponentProps,
  ModalTransition,
} from "@atlaskit/modal-dialog";
import { observer } from "mobx-react-lite";
import { createDocument } from "../../matrix/MatrixRoomManager";
import { UnreachableCaseError } from "../../util/UnreachableCaseError";
import InlineMessage from "@atlaskit/inline-message";
import SectionMessage from "@atlaskit/section-message";

import WarningIcon from "@atlaskit/icon/glyph/warning";

import Banner from "@atlaskit/banner";

export const NewPageDialog = (props: {
  isOpen: boolean;
  close: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const CustomContainer = useCallback(
    (innerProps: ContainerComponentProps) => {
      return (
        <form
          {...innerProps}
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.target as HTMLFormElement);
            const obj: any = {};
            data.forEach((val, key) => {
              obj[key] = val;
            });

            setWarning("");
            setError("");
            setLoading(true);
            const ret = await createDocument(obj.title);
            setLoading(false);

            if (typeof ret === "string") {
              switch (ret) {
                case "in-use":
                  setWarning("A page with this title already exists");
                  break;
                case "invalid-title":
                  setWarning("Invalid title");
                  break;
                case "ok":
                  props.close();
                  break;
                default:
                  throw new UnreachableCaseError(ret);
              }
            } else {
              console.error(ret);
              setError("Unknown error while creating new page.");
            }
            //   setName(obj.name);
            //   setIsOpen(false);
          }}>
          {innerProps.children}
        </form>
      );
    },
    [props.close]
  );

  return (
    <>
      <ModalTransition>
        {props.isOpen && (
          <Modal
            actions={[
              { text: "Create", type: "submit", isLoading: loading },
              { text: "Cancel", onClick: props.close },
            ]}
            components={{
              Container: CustomContainer,
            }}
            onClose={props.close}
            heading="New page">
            <Field
              id="title"
              name="title"
              label="Enter a title for your new page:">
              {({ fieldProps }) => (
                <>
                  <Textfield
                    {...fieldProps}
                    defaultValue=""
                    value={undefined}
                  />
                  {warning && <ErrorMessage>{warning}</ErrorMessage>}
                  {error && <ErrorMessage>{error}</ErrorMessage>}
                </>
              )}
            </Field>
          </Modal>
        )}
      </ModalTransition>
    </>
  );
};

export default NewPageDialog;

// {warning && (
//   // <InlineMessage
//   //   type="warning"
//   //   secondaryText={warning}></InlineMessage>
//   // <SectionMessage appearance="warning" title={warning}>

//   // </SectionMessage>
//   <p>
//     <WarningIcon label="" secondaryColor="inherit" />
//     {warning}
//   </p>
// )}
// {error && (
//   <SectionMessage appearance="error">

//   </SectionMessage>
//   // <InlineMessage type="error" secondaryText={error}></InlineMessage>
// )}
