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
  public readonly owner: string;
  public readonly documentId: string;

  constructor(uriToParse: uri.URI) {
    // TODO: validate parts, lowercase, alphanumeric?
    const parts = uriToParse.path.split("/");
    if (parts.length !== 2) {
      throw new Error("invalid identifier");
    }

    let [owner, document] = parts;
    document = getIdFromPath(document);
    if (
      !owner.startsWith("@") ||
      !owner.length ||
      !document.length ||
      owner.includes("/") ||
      document.includes("/")
    ) {
      throw new Error("invalid identifier");
    }

    super(
      TypeCellIdentifier.schemes,
      uri.URI.from({
        scheme: uriToParse.scheme,
        authority: uriToParse.authority || DEFAULT_AUTHORITY,
        path: "/" + owner + "/~" + document,
      })
    );

    this.owner = owner.substring(1);
    this.documentId = document;
  }
}
