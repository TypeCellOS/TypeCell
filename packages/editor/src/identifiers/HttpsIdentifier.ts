import { uri, path } from "vscode-lib";
import { Identifier, stringWithoutInitialSlash } from "./Identifier";

export class HttpsIdentifier extends Identifier {
  public static schemes = ["http", "https"];
  public readonly subIdentifier: string | undefined;

  constructor(uriToParse: uri.URI) {
    let [identifier, subPath] = stringWithoutInitialSlash(
      uriToParse.path
    ).split("/:/", 2);

    // call super to drop fragment, query, and make sure owner / repository is lowercase
    super(
      HttpsIdentifier.schemes,
      uri.URI.from({
        scheme: uriToParse.scheme,
        authority: uriToParse.authority,
        path: identifier,
      }),
      subPath
    );
  }

  public fullUriOfSubPath() {
    if (!this.subPath) {
      return undefined;
    }

    if (this.uri.path.endsWith("/")) {
      return super.fullUriOfSubPath();
    }
    // The parent is a file, not a directory. Join one level up
    return this.uri.with({
      path: path.join(this.uri.path, "../", this.subPath),
    });
  }
}
