import { useLocation } from "react-router-dom";
import { ENVIRONMENT } from "../../config/config";
import { parseIdentifier, tryParseIdentifier } from "../../identifiers";
import DocumentView from "../documentRenderers/DocumentView";

export const DynamicRoute = () => {
  let location = useLocation();

  if (location.pathname.startsWith("/docs")) {
    const id =
      ENVIRONMENT === "DEV"
        ? parseIdentifier("fs:", "Docs")
        : /*parseIdentifier(
            "github:yousefed/typecell-next/docs" +
              (remainingPath ? "/:/" + remainingPath : "")
          );*/
        ENVIRONMENT === "PREVIEW"
        ? parseIdentifier("http:/_docs/index.json", "Docs")
        : parseIdentifier("https:/_docs/index.json", "Docs");

    return <DocumentView id={id} />;
  }

  const parsedIdentifier = tryParseIdentifier(location.pathname.substring(1));
  if (parsedIdentifier !== "invalid-identifier") {
    return (
      // <Routes>
      //   <Route
      //     path={parsedIdentifier.toString() + "/*"}
      //     element={<DocumentView id={parsedIdentifier} />}></Route>
      //   <Route path="*" element={<div>errorouter</div>} />
      // </Routes>
      <DocumentView id={parsedIdentifier} />
    );
  }
  return <div>Not found</div>;
};
