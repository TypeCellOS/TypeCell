import { DEFAULT_HOMESERVER_HOST } from "../config/config";
import { slug } from "../util/slug";
import { uri } from "vscode-lib";
import { FileIdentifier } from "./FileIdentifier";
import { GithubIdentifier } from "./GithubIdentifier";
import { Identifier, IdentifierFactory } from "./Identifier";
import { MatrixIdentifier } from "./MatrixIdentifier";

export const identifiers = new Map<string, IdentifierFactory<Identifier>>();
const factories = [MatrixIdentifier, GithubIdentifier, FileIdentifier];
for (let factory of factories) {
  identifiers.set(factory.scheme, factory);
}

export function parseIdentifier(
  identifier: string | { owner: string; document: string }
) {
  if (typeof identifier !== "string") {
    if (!identifier.owner.length || !identifier.document.length) {
      throw new Error("invalid identifier");
    }
    const ownerSlug = slug(identifier.owner);
    const documentSlug = slug(identifier.document);
    identifier = ownerSlug + "/" + documentSlug;
  }

  if (identifier.startsWith("@")) {
    identifier =
      MatrixIdentifier.scheme +
      "://" +
      DEFAULT_HOMESERVER_HOST +
      "/" +
      identifier;
  }

  const parsedUri = uri.URI.parse(identifier);
  const identifierType = identifiers.get(parsedUri.scheme);
  if (!identifierType) {
    throw new Error("identifier not found");
  }
  const id = new identifierType(parsedUri);
  return id;
}

export function tryParseIdentifier(
  identifier: string | { owner: string; document: string }
) {
  try {
    return parseIdentifier(identifier);
  } catch (e) {
    console.warn("invalid identifier", identifier, e);
    return "invalid-identifier" as "invalid-identifier";
  }
}
