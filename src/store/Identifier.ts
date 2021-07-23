import { slug } from "../util/slug";

export type Identifier = TypeCellIdentifier | GithubIdentifier;

export type TypeCellIdentifier = {
  type: "typecell";
  owner: string;
  document: string;
  id: string;
};

export type GithubIdentifier = {
  type: "github";
  owner: string;
  repository: string;
  path: string;
  id: string;
};

export function tryParseIdentifier(identifier: string) {
  try {
    if (identifier.startsWith("@")) {
      return parseTypeCellIdentifier(identifier);
    } else if (identifier.startsWith("github:")) {
      return parseGithubIdentifier(identifier);
    } else {
      throw new Error("not supported");
    }
  } catch (e) {
    return "invalid-identifier";
  }
}

export function tryParseTypeCellIdentifier(
  identifier: string | { owner: string; document: string }
) {
  try {
    return parseTypeCellIdentifier(identifier);
  } catch (e) {
    return "invalid-identifier";
  }
}

export function parseGithubIdentifier(identifier: string): GithubIdentifier {
  if (typeof identifier !== "string") {
    throw new Error("github identifier must be a string");
  }
  identifier = identifier.trim();
  if (!identifier.startsWith("github:")) {
    throw new Error("identifier doesn't start with github:");
  }
  identifier = identifier.substr("github:".length);
  const parts = identifier.split("/");
  if (parts.length < 3) {
    throw new Error("invalid identifier");
    // return "invalid-identifier" as "invalid-identifier";
  }

  return {
    type: "github",
    owner: parts.shift()!.toLowerCase(),
    repository: parts.shift()!.toLowerCase(),
    path: parts.join("/"),
    id: "github:" + identifier,
  };
}

export function parseTypeCellIdentifier(
  identifier: string | { owner: string; document: string }
): TypeCellIdentifier {
  if (typeof identifier !== "string") {
    const ownerSlug = slug(identifier.owner);
    const documentSlug = slug(identifier.document);
    identifier = ownerSlug + "/" + documentSlug;
  }
  identifier = identifier.toLowerCase().trim();
  // validate
  const parts = identifier.split("/");
  if (parts.length !== 2) {
    throw new Error("invalid identifier");
    // return "invalid-identifier" as "invalid-identifier";
  }

  // TODO: validate parts, lowercase, alphanumeric?

  const [owner, document] = parts;

  if (
    !owner.startsWith("@") ||
    !owner.length ||
    !document.length ||
    owner.includes("/") ||
    document.includes("/")
  ) {
    throw new Error("invalid identifier");
    // return "invalid-identifier" as "invalid-identifier";
  }

  return {
    type: "typecell",
    id: identifier,
    owner,
    document,
  };
}
