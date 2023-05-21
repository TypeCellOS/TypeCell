import { path, uri } from "vscode-lib";
import { registeredIdentifiers } from "..";

import {
  DEFAULT_IDENTIFIER_BASE,
  DEFAULT_IDENTIFIER_BASE_STRING,
} from "../../config/config";
import { FileIdentifier } from "../FileIdentifier";
import { Identifier } from "../Identifier";
import { TypeCellIdentifier } from "../TypeCellIdentifier";

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

abstract class ShorthandResolver {
  /**
   * Given a shorthand (e.g.: `docs`), return the expanded path, e.g.: `http:localhost/_docs/`
   */
  abstract shorthandToExpandedPath(shorthand: string): string | undefined;

  /**
   * Given an expanded path (e.g.: `http:localhost/_docs/`), return the shorthand, e.g.: `docs`
   */
  abstract expandedPathToShorthandExact(
    expandedPath: string
  ): string | undefined;

  /**
   * Given a path (e.g.: `docs/README.md`), return the shorthand at the start of it (e.g.: `docs`)
   */
  abstract findShorthandAtStartOfPath(path: string):
    | {
        shorthand: string;
        identifier: string;
      }
    | undefined;
}

export class DefaultShorthandResolver extends ShorthandResolver {
  private readonly shortHands: Record<string, string> = {
    // docs: "http:" + window.location.hostname + "/_docs/",
    // docs: "fs:localhost:3001",
    docs: "http:localhost/_docs/",
  };

  private readonly reverseShortHands = Object.entries(this.shortHands).reduce(
    (acc, [key, value]) => {
      acc[value] = key;
      return acc;
    },
    {} as Record<string, string>
  );

  public addShorthand(shorthand: string, expandedPath: string) {
    this.shortHands[shorthand] = expandedPath;
    this.reverseShortHands[expandedPath] = shorthand;
  }

  shorthandToExpandedPath(shorthand: string): string | undefined {
    return this.shortHands[shorthand];
  }

  expandedPathToShorthandExact(expandedPath: string): string | undefined {
    return this.reverseShortHands[expandedPath];
  }

  findShorthandAtStartOfPath(path: string):
    | {
        shorthand: string;
        identifier: string;
      }
    | undefined {
    let match: { shorthand: string; identifier: string } | undefined;
    for (let sh of Object.keys(this.shortHands)) {
      if (path.startsWith(sh)) {
        if (!match || sh.length > match.shorthand.length) {
          match = {
            shorthand: sh,
            identifier: this.shortHands[sh]!,
          };
        }
      }
    }
    return match;
  }
}

export const defaultShorthandResolver = {
  current: new DefaultShorthandResolver(),
};

export function setDefaultShorthandResolver(
  shorthandResolver: DefaultShorthandResolver
) {
  defaultShorthandResolver.current = shorthandResolver;
}

/**
 * given an identifier, returns the path and shorthand to it, if it exists
 */
function getPathAndShorthandFromFirstIdentifier(
  identifier: Identifier,
  shorthandResolver: ShorthandResolver
) {
  const fullPath = identifier.toString();

  const shorthand = shorthandResolver.expandedPathToShorthandExact(fullPath);
  if (shorthand) {
    return {
      type: "shorthand",
      path: shorthand,
      separator: "/",
    };
  }

  const path = getSimplePathPartForIdentifier(
    identifier,
    DEFAULT_IDENTIFIER_BASE
  );

  return {
    type: "path",
    path,
    separator: ":/",
  };
}

function getSimplePathPartForIdentifier(
  identifier: Identifier,
  previousOrDefaultIdentifierUri?: uri.URI
) {
  if (
    previousOrDefaultIdentifierUri &&
    previousOrDefaultIdentifierUri.scheme === identifier.uri.scheme &&
    previousOrDefaultIdentifierUri.authority === identifier.uri.authority
  ) {
    if (identifier instanceof TypeCellIdentifier) {
      // TODO: this hardcoding is hacky. also, do we want different behavior for different identifiers?
      return identifier.uri.path.substring(1);
    } else if (
      identifier.uri.path.startsWith(previousOrDefaultIdentifierUri.path)
    ) {
      // we can simplify this path
      return identifier.uri.path.substring(
        previousOrDefaultIdentifierUri.path.length
      );
    }
  }
  return identifier.toString();
}

/**
 * Given multiple identifiers, returns the full path to identifiers combined
 *
 * Will:
 * - use shorthand if possible
 * - simplify paths of nested identifiers if possible
 */
export function identifiersToPath(
  identifiers: Identifier[] | Identifier,
  shorthandResolver = defaultShorthandResolver.current
): string {
  if (!Array.isArray(identifiers)) {
    identifiers = [identifiers];
  }

  if (!identifiers.length) {
    throw new Error("no identifiers passed");
  }

  let lastIdentifier: Identifier = identifiers[0];
  let rootPath = getPathAndShorthandFromFirstIdentifier(
    lastIdentifier,
    shorthandResolver
  );
  let path = rootPath.path;
  let sep = rootPath.separator;

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
 * Given an exact identifier string, return proper Identifier
 */
export function parseFullIdentifierString(
  identifierString: string
): Identifier {
  // our identifiers don't use scheme://xxx but scheme:xxx. Reason for this decision is to make it work with react-router
  identifierString = identifierString.replace(/([a-z]+:)/, "$1//");

  let parsedUri = uri.URI.parse(identifierString);

  const identifierType = registeredIdentifiers.get(parsedUri.scheme);
  if (!identifierType) {
    throw new Error("identifier not found");
  }
  const id = new identifierType(parsedUri);
  return id;
}

/**
 * Given a path of a single identifier (i.e. no separators),
 * returns the identifier or throws an error
 */
export function pathToIdentifier(
  inputPath: string,
  parentIdentifierList: Identifier[] = [],
  shorthandResolver = defaultShorthandResolver.current
): Identifier {
  // const shorthand = shorthandResolver.expandedPathToShorthandExact(inputPath);
  // if (shorthand && !parentIdentifierList.length) {
  //   inputPath = shorthand;
  // }

  if (!inputPath.includes(":") && !parentIdentifierList.length) {
    console.log(inputPath);
    // no scheme provided
    inputPath = DEFAULT_IDENTIFIER_BASE_STRING + inputPath; //.substring(1);
  } else {
    let parsedUri = uri.URI.parse(inputPath);

    if (parsedUri.scheme === "file") {
      // this indicates there was no scheme provided
      if (!parentIdentifierList.length) {
        throw new Error("no scheme provided, and no parents " + inputPath);
      }

      const parent = parentIdentifierList[parentIdentifierList.length - 1];

      parsedUri = parent.uri.with({
        // TODO: this hardcoding is hacky. also, do we want different behavior for different identifiers?
        path:
          parent instanceof TypeCellIdentifier
            ? "/" + inputPath
            : path.join(parent.uri.path || "/", inputPath),
      });
      inputPath = parsedUri.toString().replace("://", ":");
    }
  }
  console.log(inputPath);
  return parseFullIdentifierString(inputPath);
}

/**
 * Given a full path, returns an array of identifiers matched
 */
export function pathToIdentifiers(
  path: string,
  shorthandResolver = defaultShorthandResolver.current
): Identifier[] {
  const identifiers: Identifier[] = [];
  const parts = path.split(":/");

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    let shortHandMatched = shorthandResolver.findShorthandAtStartOfPath(part);

    if (shortHandMatched) {
      identifiers.push(
        parseFullIdentifierString(shortHandMatched.identifier)
        // pathToIdentifier(shortHandMatched, identifiers, shorthandResolver)
      );
      const remaining = part
        .substring(shortHandMatched.shorthand.length)
        .replace(/^\//, ""); // remove leading /
      if (remaining.length) {
        identifiers.push(
          pathToIdentifier(remaining, identifiers, shorthandResolver)
        );
      }
    } else {
      const identifier = pathToIdentifier(part, identifiers, shorthandResolver);
      identifiers.push(identifier);
    }
  }
  return identifiers;
}

export function tryPathToIdentifiers(
  path: string,
  shorthandResolver = defaultShorthandResolver.current
) {
  try {
    const ret = pathToIdentifiers(path, shorthandResolver);
    if (!ret.length) {
      return "invalid-identifier";
    }
    return ret;
  } catch (e) {
    return "invalid-identifier";
  }
}
