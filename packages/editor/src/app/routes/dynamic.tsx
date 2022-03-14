import { useLocation } from "react-router-dom";
import { tryParseIdentifier } from "../../identifiers";
import DocumentView from "../documentRenderers/DocumentView";

export const DynamicRoute = () => {
  let location = useLocation();

  const parsedIdentifier = tryParseIdentifier(location.pathname.substring(1));
  if (parsedIdentifier !== "invalid-identifier") {
    return <DocumentView id={parsedIdentifier} />;
  }
  return <div>Not found</div>;
};
