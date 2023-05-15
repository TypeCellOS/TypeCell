import { uri } from "vscode-lib";
import { Identifier } from "./Identifier";

const DEFAULT_AUTHORITY = "typecell.org";

// takes a path string like "this-is-a-title~sd32Sfsdf123" and returns the id "sd32Sfsdf123"
function getIdFromPath(path: string) {
  if (path.includes("/")) {
    throw new Error("invalid path");
  }
  const parts = path.split("~");
  if (parts.length !== 2 || parts[1].charAt(0) !== "d") {
    throw new Error("invalid path");
  }
  return parts.pop()!;
}

export class TypeCellIdentifier extends Identifier {
  public static schemes = ["typecell"];

  constructor(uriToParse: uri.URI) {
    if (uriToParse.path.includes("~")) {
      uriToParse = uriToParse.with({
        path: "/" + getIdFromPath(uriToParse.path.substring(1)),
      });
    }
    super(TypeCellIdentifier.schemes, uriToParse);

    if (!this.uri.path.startsWith("/d")) {
      throw new Error("invalid path");
    }
  }

  get documentId() {
    if (!this.uri.path.startsWith("/d")) {
      throw new Error("invalid path");
    }
    return this.uri.path.substring(1);
  }
}
