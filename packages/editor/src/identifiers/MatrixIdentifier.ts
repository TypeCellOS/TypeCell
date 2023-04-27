import { uri } from "vscode-lib";
import { Identifier } from "./Identifier";

const DEFAULT_AUTHORITY = "mx.typecell.org";

export class MatrixIdentifier extends Identifier {
  public static schemes = ["mx"];
  public readonly owner: string;
  public readonly document: string;

  constructor(uriToParse: uri.URI, title?: string) {
    const parts = uriToParse.path.split("/");

    if (parts.length !== 3 || parts[0] !== "") {
      throw new Error("invalid identifier");
    }
    parts.shift();

    // TODO: validate parts, lowercase, alphanumeric?
    const [owner, document] = parts;

    if (
      !owner.startsWith("@") ||
      !owner.length ||
      !document.length ||
      owner.includes("/") ||
      document.includes("/")
    ) {
      throw new Error("invalid identifier");
    }
    // call super to drop fragment, query, and make sure path is lowercase
    super(
      MatrixIdentifier.schemes,
      uri.URI.from({
        scheme: uriToParse.scheme,
        authority: uriToParse.authority || DEFAULT_AUTHORITY,
        path: "/" + owner + "/" + document,
      })
    );
    this.owner = owner;
    this.document = document;
  }

  public get roomName() {
    return this.owner + "/" + this.document;
  }

  public get defaultURI() {
    return this.uri.authority === DEFAULT_AUTHORITY
      ? this.uri.with({
          authority: null,
        })
      : this.uri;
  }
}
