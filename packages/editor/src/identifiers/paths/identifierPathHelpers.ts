import { path, uri } from "vscode-lib";
import { registeredIdentifiers } from "..";

import { DEFAULT_IDENTIFIER_BASE } from "../../config/config";
import { FileIdentifier } from "../FileIdentifier";
import { Identifier } from "../Identifier";

// if (location.pathname.startsWith("/docs")) {
//   const id =
//     ENVIRONMENT === "DEV"
//       ? parseIdentifier("http://localhost:4174/_docs/index.json", "Docs") //
//       : //parseIdentifier("fs:", "Docs")
//       /*parseIdentifier(
//           "github:yousefed/typecell-next/docs" +
//             (remainingPath ? "/:/" + remainingPath : "")
//         );*/
//       ENVIRONMENT === "PREVIEW"
//       ? parseIdentifier("http:/_docs/index.json", "Docs")
//       : parseIdentifier("https:/_docs/index.json", "Docs");

//   return <DocumentView id={id} />;
// }

const shortHands: Record<string, string> = {
  // docs: "http:" + window.location.hostname + "/_docs/",
  // docs: "fs:localhost:3001",
  docs: "http:localhost/_docs/",
};

const reverseShortHands = Object.entries(shortHands).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * given an identifier, returns the path and shorthand to it, if it exists
 */
function getPathAndShorthandFromFirstIdentifier(identifier: Identifier) {
  const path = getSimplePathPartForIdentifier(
    identifier,
    DEFAULT_IDENTIFIER_BASE
  );
  const shorthand = reverseShortHands[path];
  if (shorthand) {
    return {
      path,
      shorthand,
    };
  }
  return path;
}

function getSimplePathPartForIdentifier(
  identifier: Identifier,
  previousOrDefaultIdentifierUri: uri.URI
) {
  if (
    previousOrDefaultIdentifierUri &&
    previousOrDefaultIdentifierUri.scheme === identifier.uri.scheme &&
    previousOrDefaultIdentifierUri.authority === identifier.uri.authority &&
    identifier.uri.path.startsWith(previousOrDefaultIdentifierUri.path)
  ) {
    // we can simplify this path
    return identifier.uri.path.substring(
      previousOrDefaultIdentifierUri.path.length
    );
  } else {
    return identifier.toString();
  }
}

/**
 * Given multiple identifiers, returns the full path to identifiers combined
 *
 * Will:
 * - use shorthand if possible
 * - simplify paths of nested identifiers if possible
 */
export function identifiersToPath(
  identifiers: Identifier[] | Identifier
): string {
  if (!Array.isArray(identifiers)) {
    identifiers = [identifiers];
  }

  if (!identifiers.length) {
    throw new Error("no identifiers passed");
  }

  let lastIdentifier: Identifier = identifiers[0];
  let rootPath = getPathAndShorthandFromFirstIdentifier(lastIdentifier);
  let path: string;
  let sep = ":/";
  if (typeof rootPath === "string") {
    path = rootPath;
  } else {
    path = rootPath.shorthand;
    sep = "/";
  }

  for (let i = 1; i < identifiers.length; i++) {
    const identifier = identifiers[i];
    const part = getSimplePathPartForIdentifier(
      identifiers[i],
      lastIdentifier.uri
    );
    path += sep + part;
    lastIdentifier = identifier;
    sep = ":/";
  }
  return path;
}

/**
 * Return an identifier with an appended path
 */
export function getIdentifierWithAppendedPath(
  identifier: Identifier,
  pathToAppend: string
): Identifier {
  const uri = identifier.uri.with({
    path: path.join(identifier.uri.path || "/", pathToAppend),
  });
  return new FileIdentifier(uri);
}

/**
 * Given a path of a single identifier (i.e. no separators),
 * returns the identifier or throws an error
 */
export function pathToIdentifier(
  inputPath: string,
  parentIdentifierList: Identifier[] = []
): Identifier {
  if (shortHands[inputPath] && !parentIdentifierList.length) {
    inputPath = shortHands[inputPath];
  }

  let identifierWithProperScheme: string;
  if (!inputPath.includes(":") && !parentIdentifierList.length) {
    console.log(inputPath);
    // no scheme provided
    identifierWithProperScheme = DEFAULT_IDENTIFIER_BASE.toString() + inputPath; //.substring(1);
  } else {
    // our identifiers don't use scheme://xxx but scheme:xxx. Reason for this decision is to make it work with react-router
    identifierWithProperScheme = inputPath.replace(/([a-z]+:)/, "$1//");
  }
  let parsedUri = uri.URI.parse(identifierWithProperScheme);

  if (parsedUri.scheme === "file") {
    // this indicates there was no scheme provided
    if (!parentIdentifierList.length) {
      throw new Error("no scheme provided, and no parents " + inputPath);
    }

    const parent = parentIdentifierList[parentIdentifierList.length - 1];
    parsedUri = parent.uri.with({
      path: path.join(parent.uri.path || "/", inputPath),
    });
  }

  const identifierType = registeredIdentifiers.get(parsedUri.scheme);
  if (!identifierType) {
    throw new Error("identifier not found");
  }
  const id = new identifierType(parsedUri);
  return id;
}

/**
 * Given a full path, returns an array of identifiers matched
 */
export function pathToIdentifiers(path: string): Identifier[] {
  const identifiers: Identifier[] = [];
  const parts = path.split(":/");

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    let shortHandMatched: string | undefined;

    for (let sh of Object.keys(shortHands)) {
      if (part.startsWith(sh)) {
        shortHandMatched = sh;
        break;
      }
    }

    if (shortHandMatched) {
      identifiers.push(pathToIdentifier(shortHandMatched, identifiers));
      const remaining = part.substring(shortHandMatched.length);
      if (remaining.length) {
        identifiers.push(pathToIdentifier(remaining, identifiers));
      }
    } else {
      const identifier = pathToIdentifier(part, identifiers);
      identifiers.push(identifier);
    }
  }
  return identifiers;
}

export function tryPathToIdentifiers(path: string) {
  try {
    const ret = pathToIdentifiers(path);
    if (!ret.length) {
      return "invalid-identifier";
    }
    return ret;
  } catch (e) {
    return "invalid-identifier";
  }
}
