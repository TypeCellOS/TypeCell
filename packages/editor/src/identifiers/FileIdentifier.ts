import { uri } from "vscode-lib";
import { Identifier, stringWithoutInitialSlash } from "./Identifier";

export class FileIdentifier extends Identifier {
  public static scheme = "fs";

  public readonly path: string;

  constructor(uriToParse: uri.URI) {
    let [identifier, subPath] = uriToParse.path.split("/:/", 2);

    // call super to drop fragment, query, and make sure path is lowercase
    super(
      FileIdentifier.scheme,
      uri.URI.from({
        scheme: uriToParse.scheme,
        authority: uriToParse.authority,
        path: identifier,
      }),
      subPath
    );

    this.path = stringWithoutInitialSlash(identifier);
  }
}
