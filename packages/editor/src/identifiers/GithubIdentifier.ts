/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { uri } from "vscode-lib";
import { Identifier } from "./Identifier";

export class GithubIdentifier extends Identifier {
  public static schemes = ["github"];
  public readonly owner: string;
  public readonly repository: string;
  public readonly path: string;

  constructor(uriToParse: uri.URI) {
    const parts = uriToParse.path.split("/");
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
      })
    );
    this.path = path;
    this.owner = owner;
    this.repository = repository;
  }
}
