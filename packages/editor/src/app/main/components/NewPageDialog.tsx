import { ErrorMessage, Field } from "@atlaskit/form";
import Modal, {
  ContainerComponentProps,
  ModalTransition,
} from "@atlaskit/modal-dialog";
import Textfield from "@atlaskit/textfield";
import React, { useCallback, useState } from "react";

import { BaseResource } from "../../../store/BaseResource";
import { DocConnection } from "../../../store/DocConnection";
import { getStoreService } from "../../../store/local/stores";

import { UnreachableCaseError } from "../../../util/UnreachableCaseError";

export const NewPageDialog = (props: {
  isOpen: boolean;
  close: () => void;
  ownerId: string;
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
            // TODO: format title?
            e.preventDefault();
            const data = new FormData(e.target as HTMLFormElement);
            const obj: any = {};
            data.forEach((val, key) => {
              obj[key] = val;
            });

            setWarning("");
            setError("");
            setLoading(true);

            const ret = await DocConnection.create({
              owner: props.ownerId,
              document: obj.title,
            });

            setLoading(false);

            if (typeof ret === "string") {
              switch (ret) {
                case "already-exists":
                  setWarning("A page with this title already exists");
                  break;
                case "invalid-identifier":
                  setWarning("Invalid title");
                  break;
                default:
                  throw new UnreachableCaseError(ret);
              }
            } else if (ret instanceof BaseResource) {
              // ret.create("!richtext");
              ret.create("!notebook");
              ret.doc.cellList.addCell(0, "markdown", "# " + obj.title);
              ret.doc.cellList.addCell(
                1,
                "typescript",
                `export let message = "Hello World"`
              );
              getStoreService().navigationStore.navigateToDocument(ret);

              // Bit hacky, dispose with timeout,
              // because navigateToDocument will (indirectly) need the doc
              // so it's nice to make sure we don't dispose it beforehand (and prevent a reload)
              setTimeout(() => {
                ret.dispose();
              }, 500);

              props.close();
            } else {
              if (ret.status !== "error") {
                throw new UnreachableCaseError(ret.status);
              }
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
    [props]
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
