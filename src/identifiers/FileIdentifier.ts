import { URI } from "../util/vscode-common/uri";
import { Identifier, stringWithoutInitialSlash } from "./Identifier";

export class FileIdentifier extends Identifier {
  public static scheme = "file";

  public readonly path: string;

  constructor(uri: URI) {
    let [identifier, subPath] = uri.path.split("/:/", 2);

    // call super to drop fragment, query, and make sure path is lowercase
    super(
      FileIdentifier.scheme,
      URI.from({
        scheme: uri.scheme,
        authority: uri.authority,
        path: uri.path,
      }),
      subPath
    );

    this.path = stringWithoutInitialSlash(identifier);
  }
}
