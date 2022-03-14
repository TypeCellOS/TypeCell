import { ENVIRONMENT } from "../../config/config";
import { parseIdentifier } from "../../identifiers";
import DocumentView from "../documentRenderers/DocumentView";

export const DocsRoute = () => {
  const id =
    ENVIRONMENT === "DEV"
      ? parseIdentifier("fs:", "Docs")
      : /*parseIdentifier(
            "github:yousefed/typecell-next/docs" +
              (remainingPath ? "/:/" + remainingPath : "")
          );*/
        parseIdentifier("https:/_docs/index.json", "Docs");

  return <DocumentView id={id} />;
};
