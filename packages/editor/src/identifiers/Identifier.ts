import { uri } from "vscode-lib";

export interface IdentifierFactory<T extends Identifier> {
  new (uri: uri.URI, title?: string): T;
  schemes: string[];
}

// http:localhost/_docs:/http:localhost/_docs/README.md
// http:localhost/_docs:/README.md

// fs:localhost:/fs:localhost/README.md
// fs:localhost:/README.md

// typecell:localhost/@yousef:/typecell:localhost/@yousef/id123

export abstract class Identifier {
  protected constructor(schemes: string[], public readonly uri: uri.URI) {
    if (!schemes.includes(uri.scheme)) {
      throw new Error("scheme doesn't match");
    }
  }

  public toString() {
    // const uri1 = uri.URI.parse("http://example.com");
    // const uri2 = uri.URI.parse("http:///example.com");
    // debugger;
    return Identifier.uriToString(this.uri);
  }

  protected static uriToString(uri: uri.URI) {
    let ret = uri.toString(true);
    ret = ret.replace(/([a-z]+:)\/\//, "$1");
    return ret;
  }

  // // TODO: make defaultScheme configurable
  // public toRouteString(defaultScheme = "typecell") {
  //   let str = Identifier.uriToString(this.defaultURI);
  //   if (
  //     !this.defaultURI.authority &&
  //     this.defaultURI.scheme === defaultScheme
  //   ) {
  //     str = str.substring(defaultScheme.length + 1);
  //   }
  //   if (this.subPath) {
  //     str += ":/" + this.subPath;
  //   }
  //   if (!str.startsWith("/")) {
  //     str = "/" + str;
  //   }
  //   return str;
  // }

  // public equals(other: Identifier) {
  //   return this.toString() === other.toString();
  // }

  // public equalsIncludingSub(other: Identifier) {
  //   return this.equals(other) && this.subPath === other.subPath;
  // }

  // public fullUriOfSubPath() {
  //   if (!this.subPath) {
  //     return undefined;
  //   }

  //   return Identifier.uriToString(
  //     this.uri.with({
  //       path: path.join(this.uri.path || "/", this.subPath),
  //     })
  //   );
  // }
}

export function stringWithoutInitialSlash(path: string) {
  if (path.startsWith("/")) {
    return path.substring(1);
  }
  return path;
}
