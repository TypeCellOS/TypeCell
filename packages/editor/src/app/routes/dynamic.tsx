import { useLocation } from "react-router-dom";
import { tryParseIdentifier } from "../../identifiers";
import DocumentView from "../documentRenderers/DocumentView";

export const DynamicRoute = () => {
  let location = useLocation();

  const identifier = tryParseIdentifier(location.pathname.substring(1));
  if (identifier !== "invalid-identifier") {
    return (
      // <Routes>
      //   <Route
      //     path={parsedIdentifier.toString() + "/*"}
      //     element={<DocumentView id={parsedIdentifier} />}></Route>
      //   <Route path="*" element={<div>errorouter</div>} />
      // </Routes>
      <DocumentView id={identifier} />
    );
  }
  return <div>Not found</div>;
};
