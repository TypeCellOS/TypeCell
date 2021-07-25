import { makeObservable, observable } from "mobx";
import { URI } from "../util/vscode-common/uri";

export interface IdentifierFactory<T extends Identifier> {
  new (uri: URI): T;
  scheme: string;
}

export abstract class Identifier {
  public subPath?: string;

  protected constructor(
    scheme: string,
    public readonly uri: URI,
    subPath: string | undefined
  ) {
    if (this.uri.scheme !== scheme) {
      throw new Error("scheme doesn't match");
    }
    this.subPath = subPath;

    makeObservable(this, {
      subPath: observable.ref,
    });
  }

  public toString() {
    return this.uri.toString();
  }
}

export function stringWithoutInitialSlash(path: string) {
  if (path.startsWith("/")) {
    return path.substring(1);
  }
  return path;
}
