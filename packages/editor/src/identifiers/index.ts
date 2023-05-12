import { FileIdentifier } from "./FileIdentifier";
import { GithubIdentifier } from "./GithubIdentifier";
import { HttpsIdentifier } from "./HttpsIdentifier";
import { Identifier, IdentifierFactory } from "./Identifier";
import { MatrixIdentifier } from "./MatrixIdentifier";
import { TypeCellIdentifier } from "./TypeCellIdentifier";
import { pathToIdentifier } from "./paths/identifierPathHelpers";

export const registeredIdentifiers = new Map<
  string,
  IdentifierFactory<Identifier>
>();
const factories = [
  TypeCellIdentifier,
  MatrixIdentifier,
  GithubIdentifier,
  FileIdentifier,
  HttpsIdentifier,
];
for (let factory of factories) {
  for (let scheme of factory.schemes) {
    registeredIdentifiers.set(scheme, factory);
  }
}

// TODO: revisit owner
export function parseIdentifier(identifier: string) {
  // if (typeof identifier !== "string") {
  //   if (!identifier.owner.length || !identifier.document.length) {
  //     throw new Error("invalid identifier");
  //   }
  //   const ownerSlug = slug(identifier.owner);
  //   const documentSlug = slug(identifier.document);
  //   if (DEFAULT_PROVIDER === "supabase") {
  //     // TODO: title slug
  //     // in case of supabase, identifier.document is a nanoid
  //     identifier = "@" + ownerSlug + "/~" + identifier.document;
  //   } else {
  //     identifier = "@" + ownerSlug + "/" + documentSlug;
  //   }
  // }

  // if (identifier.startsWith("@")) {
  //   if (DEFAULT_PROVIDER === "supabase") {
  //     identifier =
  //       TypeCellIdentifier.schemes[0] +
  //       ":" +
  //       "typecell.org" + // TODO: make this configurable
  //       "/" +
  //       identifier;
  //   } else {
  //     identifier =
  //       MatrixIdentifier.schemes[0] +
  //       ":" +
  //       DEFAULT_HOMESERVER_URI.authority +
  //       "/" +
  //       identifier;
  //   }
  // }
  return pathToIdentifier(identifier);
  // return pathToIdentifiers(identifier)[0];
}

// export function tryParseIdentifier(
//   identifier: string | { owner: string; document: string },
//   title?: string
// ) {
//   try {
//     return parseIdentifier(identifier, title);
//   } catch (e) {
//     console.warn("invalid identifier", identifier, e);
//     return "invalid-identifier" as "invalid-identifier";
//   }
// }
