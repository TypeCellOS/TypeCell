import { path, uri } from "vscode-lib";

export interface IdentifierFactory<T extends Identifier> {
  new (uri: uri.URI, title?: string): T;
  schemes: string[];
}

export abstract class Identifier {
  public subPath?: string;

  protected constructor(
    schemes: string[],
    public readonly uri: uri.URI,
    subPath: string | undefined,
    public readonly title?: string
  ) {
    if (!schemes.includes(this.uri.scheme)) {
      throw new Error("scheme doesn't match");
    }
    this.subPath = subPath;
  }

  public toString() {
    return this.uri.toString(true);
  }

  protected get defaultURI() {
    return this.uri;
  }

  public toRouteString(defaultScheme = "mx") {
    let str = this.defaultURI.toString(true);
    if (
      !this.defaultURI.authority &&
      this.defaultURI.scheme === defaultScheme
    ) {
      str = str.substring(defaultScheme.length + 1);
    }
    if (this.subPath) {
      str += "/:/" + this.subPath;
    }
    if (!str.startsWith("/")) {
      str = "/" + str;
    }
    return str;
  }

  public equals(other: Identifier) {
    return this.toString() === other.toString();
  }

  public equalsIncludingSub(other: Identifier) {
    return this.equals(other) && this.subPath === other.subPath;
  }

  public fullUriOfSubPath() {
    if (!this.subPath) {
      return undefined;
    }
    return this.uri.with({
      path: path.join(this.uri.path, this.subPath),
    });
  }
}

export function stringWithoutInitialSlash(path: string) {
  if (path.startsWith("/")) {
    return path.substring(1);
  }
  return path;
}
