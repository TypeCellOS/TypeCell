import { URI } from "../util/vscode-common/uri";
import {
  Identifier,
  IdentifierFactory,
  stringWithoutInitialSlash,
} from "./Identifier";

export class GithubIdentifier extends Identifier {
  public static scheme = "github";
  public readonly owner: string;
  public readonly repository: string;
  public readonly path: string;
  public readonly subIdentifier: string | undefined;

  constructor(uri: URI) {
    let [identifier, subPath] = stringWithoutInitialSlash(uri.path).split(
      "/:/",
      2
    );

    const parts = identifier.split("/");
    if (parts.length < 3) {
      throw new Error("invalid identifier");
      // return "invalid-identifier" as "invalid-identifier";
    }

    const owner = parts.shift()!.toLowerCase();
    const repository = parts.shift()!.toLowerCase();
    const path = parts.join("/");

    // call super to drop fragment, query, and make sure owner / repository is lowercase
    super(
      GithubIdentifier.scheme,
      URI.from({
        scheme: uri.scheme,
        authority: uri.authority,
        path: owner + "/" + repository + "/" + path,
      }),
      subPath
    );
    this.path = path;
    this.owner = owner;
    this.repository = repository;
  }
}