import { useLocation } from "react-router-dom";
import { tryPathToIdentifiers } from "../../identifiers/paths/identifierPathHelpers";
import DocumentView from "../documentRenderers/DocumentView";

export const DynamicRoute = () => {
  debugger;
  let location = useLocation();

  console.warn(location.pathname.substring(1));
  const identifiers = tryPathToIdentifiers(location.pathname.substring(1));
  if (identifiers !== "invalid-identifier") {
    return (
      // <Routes>
      //   <Route
      //     path={parsedIdentifier.toString() + "/*"}
      //     element={<DocumentView id={parsedIdentifier} />}></Route>
      //   <Route path="*" element={<div>errorouter</div>} />
      // </Routes>
      <DocumentView id={identifiers.shift()!} subIdentifiers={identifiers} />
    );
  } else {
    return <div>Not found</div>;
  }
};
