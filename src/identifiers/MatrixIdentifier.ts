import MatrixProvider from "../matrix-yjs/MatrixProvider";
import { URI } from "../util/vscode-common/uri";
import { Identifier, stringWithoutInitialSlash } from "./Identifier";

export class MatrixIdentifier extends Identifier {
  public static scheme = "mx";
  public readonly owner: string;
  public readonly document: string;

  constructor(uri: URI) {
    let [identifier, subPath] = stringWithoutInitialSlash(uri.path).split(
      "/:/",
      2
    );
    identifier = identifier.toLowerCase().trim();
    const parts = identifier.split("/");
    if (parts.length !== 2) {
      throw new Error("invalid identifier");
    }

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
      MatrixIdentifier.scheme,
      URI.from({
        scheme: uri.scheme,
        authority: uri.authority || "mx.typecell.org",
        path: "/" + owner + "/" + document,
      }),
      subPath
    );
    this.owner = owner;
    this.document = document;
  }

  public get roomName() {
    return this.owner + "/" + this.document;
  }
}
