import { uri } from "vscode-lib";
import { Identifier, stringWithoutInitialSlash } from "./Identifier";

export class GithubIdentifier extends Identifier {
  public static schemes = ["github"];
  public readonly owner: string;
  public readonly repository: string;
  public readonly path: string;

  constructor(uriToParse: uri.URI, title?: string) {
    let [identifier, subPath] = stringWithoutInitialSlash(
      uriToParse.path
    ).split("/:/", 2);

    const parts = identifier.split("/");
    if (parts.length < 2) {
      throw new Error("invalid identifier");
      // return "invalid-identifier" as "invalid-identifier";
    }

    const owner = parts.shift()!.toLowerCase();
    const repository = parts.shift()!.toLowerCase();
    const path = parts.join("/");

    // call super to drop fragment, query, and make sure owner / repository is lowercase
    super(
      GithubIdentifier.schemes,
      uri.URI.from({
        scheme: uriToParse.scheme,
        authority: uriToParse.authority,
        path: owner + "/" + repository + (path.length ? "/" + path : ""),
      }),
      subPath,
      title
    );
    this.path = path;
    this.owner = owner;
    this.repository = repository;
  }
}
