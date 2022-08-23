import Button, { LoadingButton } from "@atlaskit/button";
import { ErrorMessage, Field } from "@atlaskit/form";
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTransition,
} from "@atlaskit/modal-dialog";
import Textfield from "@atlaskit/textfield";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Y from "yjs";
import { BaseResource } from "../../../store/BaseResource";
import { DocConnection } from "../../../store/DocConnection";
import { UnreachableCaseError } from "../../../util/UnreachableCaseError";
import { toDocument } from "../../routes/routes";
import { Card } from "./common/card/Card";
import { CardContainer } from "./common/card/CardContainer";

export const NewPageDialog = (props: {
  isOpen: boolean;
  close: () => void;
  ownerId: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<"!richtext" | "!notebook">(
    "!notebook"
  );
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const navigate = useNavigate();

  return (
    <>
      <ModalTransition>
        {props.isOpen && (
          <Modal onClose={props.close}>
            <form
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
                  if (selectedType === "!richtext") {
                    ret.create("!richtext");
                    const blockgroup = new Y.XmlElement("blockgroup");
                    const tcblock = new Y.XmlElement("tcblock");
                    tcblock.setAttribute("headingType", "1");
                    // tcblock.setAttribute("id", "123");

                    const tccontent = new Y.XmlElement("tccontent");
                    tccontent.insert(0, [new Y.XmlText(obj.title)]);

                    tcblock.insert(0, [tccontent]);
                    blockgroup.insert(0, [tcblock]);

                    ret.doc.data.insert(0, [blockgroup]);
                  } else if (selectedType === "!notebook") {
                    ret.create("!notebook");
                    ret.doc.cellList.addCell(0, "markdown", "# " + obj.title);
                    ret.doc.cellList.addCell(
                      1,
                      "typescript",
                      `export let message = "Hello World"`
                    );
                  } else {
                    throw new UnreachableCaseError(selectedType);
                  }

                  navigate(toDocument(ret));

                  // Bit hacky, dispose with timeout,
                  // because navigateToDocument will (indirectly) need the doc
                  // so it's nice to make sure we don't dispose it beforehand (and prevent a reload)
                  setTimeout(() => {
                    ret.dispose();
                  }, 500);
                } else {
                  if (ret.status !== "error") {
                    throw new UnreachableCaseError(ret.status);
                  }
                  console.error(ret);
                  setError("Unknown error while creating new document.");
                }
                //   setName(obj.name);
                //   setIsOpen(false);
              }}>
              <ModalHeader>
                <ModalTitle>New:</ModalTitle>
              </ModalHeader>
              <ModalBody>
                <CardContainer>
                  <Card
                    title="Notebook"
                    body="A notebook-style programming environment for developing live blocks of code."
                    selected={selectedType === "!notebook"}
                    onClick={() => setSelectedType("!notebook")}
                  />
                  <Card
                    title="Document"
                    body="A rich text document for writing documents in a block-based editor."
                    selected={selectedType === "!richtext"}
                    onClick={() => setSelectedType("!richtext")}
                  />
                </CardContainer>
                <Field
                  id="title"
                  name="title"
                  label="Enter a title for your new page:">
                  {({ fieldProps }) => (
                    <>
                      <Textfield
                        {...fieldProps}
                        defaultValue=""
                        autoFocus
                        value={undefined}
                      />
                      {warning && <ErrorMessage>{warning}</ErrorMessage>}
                      {error && <ErrorMessage>{error}</ErrorMessage>}
                    </>
                  )}
                </Field>
                <div>
                  <small>(Note that your pages are public by default)</small>
                </div>
              </ModalBody>
              <ModalFooter>
                <LoadingButton
                  appearance="primary"
                  isLoading={loading}
                  type="submit">
                  Create
                </LoadingButton>
                <Button appearance="subtle" onClick={props.close}>
                  Cancel
                </Button>
              </ModalFooter>
            </form>
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
