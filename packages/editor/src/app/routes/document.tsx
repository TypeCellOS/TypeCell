import { useParams } from "react-router-dom";
import { parseIdentifier } from "../../identifiers";
import DocumentView from "../documentRenderers/DocumentView";

export const DocumentRoute = () => {
  let params = useParams();
  let owner = params.userParam;
  let document = params.documentParam;
  if (!owner || !document) {
    throw new Error("unexpected");
  }
  owner = "@" + owner;
  const parsedIdentifier = parseIdentifier({ owner, document });

  return <DocumentView id={parsedIdentifier} />;
};
