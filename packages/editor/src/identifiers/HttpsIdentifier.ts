import { uri } from "vscode-lib";
import { Identifier } from "./Identifier";

export class HttpsIdentifier extends Identifier {
  public static schemes = ["http", "https"];

  constructor(uri: uri.URI) {
    // call super to drop fragment, query, and make sure owner / repository is lowercase
    super(HttpsIdentifier.schemes, uri);
  }

  // public fullUriOfSubPath() {
  //   if (!this.subPath) {
  //     return undefined;
  //   }
  //   if (this.uri.path.endsWith("/")) {
  //     return super.fullUriOfSubPath();
  //   }
  //   // The parent is a file, not a directory. Join one level up
  //   return Identifier.uriToString(
  //     this.uri.with({
  //       path: path.join(this.uri.path, "../", this.subPath),
  //     })
  //   );
  // }
}
