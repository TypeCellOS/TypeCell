import { slug } from "../util/slug";

export type Identifier = ReturnType<typeof parseIdentifier>;

export function tryParseIdentifier(
  identifier: string | { owner: string; document: string }
) {
  try {
    return parseIdentifier(identifier);
  } catch (e) {
    return "invalid-identifier";
  }
}
export function parseIdentifier(
  identifier: string | { owner: string; document: string }
) {
  if (typeof identifier !== "string") {
    const ownerSlug = slug(identifier.owner);
    const documentSlug = slug(identifier.document);
    identifier = ownerSlug + "/" + documentSlug;
  }

  // validate
  const parts = identifier.split("/");
  if (parts.length !== 2) {
    throw new Error("invalid identifier");
    // return "invalid-identifier" as "invalid-identifier";
  }

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
    id: identifier,
    owner,
    document,
  };
}
