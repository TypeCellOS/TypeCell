import { path, uri } from "vscode-lib";
import { registeredIdentifiers } from "..";
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
  docs: "fs:localhost:3001",
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
export function getPathFromIdentifier(identifier: Identifier) {
  const path = identifier.toString();
  const shorthand = reverseShortHands[path];
  if (shorthand) {
    return {
      path,
      shorthand,
    };
  }
  return path;
}

/**
 * Given multiple identifiers, returns the full path to identifiers combined
 *
 * Will:
 * - use shorthand if possible
 * - simplify paths of nested identifiers if possible
 */
export function getPathFromIdentifiers(
  identifiers: Identifier[] | Identifier
): string {
  if (!Array.isArray(identifiers)) {
    identifiers = [identifiers];
  }

  if (!identifiers.length) {
    throw new Error("no identifiers passed");
  }

  let lastIdentifier: Identifier = identifiers[0];
  let rootPath = getPathFromIdentifier(lastIdentifier);
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
    if (
      lastIdentifier &&
      lastIdentifier.uri.scheme === identifier.uri.scheme &&
      lastIdentifier.uri.authority === identifier.uri.authority &&
      identifier.uri.path.startsWith(lastIdentifier.uri.path)
    ) {
      // we can simplify this path
      path +=
        sep + identifier.uri.path.substring(lastIdentifier.uri.path.length + 1);
    } else {
      path += sep + identifier.toString();
    }

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
export function getIdentifierFromPath(
  inputPath: string,
  parentIdentifierList: Identifier[] = []
): Identifier {
  if (shortHands[inputPath]) {
    inputPath = shortHands[inputPath];
  }

  // our identifiers don't use scheme://xxx but scheme:xxx. Reason for this decision is to make it work with react-router
  let identifierWithProperScheme = inputPath.replace(/([a-z]+:)/, "$1//");

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
      identifiers.push(getIdentifierFromPath(shortHandMatched, identifiers));
      const remaining = part.substring(shortHandMatched.length);
      if (remaining.length) {
        identifiers.push(getIdentifierFromPath(remaining, identifiers));
      }
    } else {
      const identifier = getIdentifierFromPath(part, identifiers);
      identifiers.push(identifier);
    }
  }
  return identifiers;
}
