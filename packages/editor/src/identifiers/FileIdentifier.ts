import { uri } from "vscode-lib";
import { Identifier } from "./Identifier";

export class FileIdentifier extends Identifier {
  public static schemes = ["fs"];

  constructor(uri: uri.URI) {
    // call super to drop fragment, query, and make sure path is lowercase
    super(FileIdentifier.schemes, uri);
  }

  public get path() {
    return this.uri.path;
  }
}
