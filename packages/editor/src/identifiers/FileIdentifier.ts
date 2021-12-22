import { uri } from "vscode-lib";
import { Identifier, stringWithoutInitialSlash } from "./Identifier";

export class FileIdentifier extends Identifier {
  public static schemes = ["fs"];

  public readonly path: string;

  constructor(uriToParse: uri.URI, title?: string) {
    let [identifier, subPath] = uriToParse.path.split("/:/", 2);

    // call super to drop fragment, query, and make sure path is lowercase
    super(
      FileIdentifier.schemes,
      uri.URI.from({
        scheme: uriToParse.scheme,
        authority: uriToParse.authority,
        path: identifier,
      }),
      subPath,
      title
    );

    this.path = stringWithoutInitialSlash(identifier);
  }
}
