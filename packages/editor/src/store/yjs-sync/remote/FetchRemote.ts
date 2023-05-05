import { makeObservable, observable, runInAction } from "mobx";
import { path, strings } from "vscode-lib";

import _ from "lodash";
import * as Y from "yjs";
import { filesToTreeNodes } from "../../../app/documentRenderers/project/directoryNavigation/treeNodeUtil";
import { HttpsIdentifier } from "../../../identifiers/HttpsIdentifier";
import { getIdentifierWithAppendedPath } from "../../../identifiers/paths/identifierPathHelpers";
import { markdownToYDoc } from "../../../integrations/markdown/import";
import ProjectResource from "../../ProjectResource";
import { ChildReference } from "../../referenceDefinitions/child";
import { Remote } from "./Remote";

export default class FetchRemote extends Remote {
  private disposed = false;
  protected id: string = "fetch";
  public canCreate: boolean = false;

  public canWrite: boolean = true; // always initialize as true until the user starts trying to make changes

  public get awareness() {
    return undefined;
  }

  public constructor(
    _ydoc: Y.Doc,
    private readonly identifier: HttpsIdentifier
  ) {
    super(_ydoc);
    makeObservable(this, {
      canWrite: observable.ref,
    });
  }

  private documentUpdateListener = async (update: any, origin: any) => {
    if (origin === this) {
      // these are updates that came in from this provider
      return;
    }
    if (origin?.provider) {
      // remote update
      return;
    }
    runInAction(() => (this.canWrite = false));
  };

  public async initialize() {
    try {
      await this.initializeNoCatch();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  private async getNewYDocFromDir(objects: string[]) {
    const newDoc = new Y.Doc();
    newDoc.getMap("meta").set("type", "!project");
    const project = new ProjectResource(newDoc, this.identifier, () => {
      throw new Error("not implemented");
    }); // TODO

    const tree = filesToTreeNodes(
      objects.map((object) => ({ fileName: object }))
    );

    tree.forEach((node) => {
      const id = getIdentifierWithAppendedPath(this.identifier, node.fileName);

      project.addRef(ChildReference, id.toString(), undefined, false);
    });

    return newDoc;
  }

  private fetchIndex = _.memoize(async (path: string) => {
    return (await (await fetch(path)).json()) as string[];
  });

  private async getNewYDocFromFetch() {
    if (this.identifier.uri.path.endsWith(".json")) {
      const json = await this.fetchIndex(this.identifier.uri.toString());
      return this.getNewYDocFromDir(json);
    } else if (this.identifier.uri.path.endsWith(".md")) {
      const contents = await (
        await fetch(this.identifier.uri.toString())
      ).text();

      return markdownToYDoc(contents, path.basename(this.identifier.uri.path));
    } else {
      // TODO: this is hacky. We should use json from parent route instead. Revise routing?

      const [root, ...remainders] = strings
        .trim(this.identifier.uri.path, "/")
        .split("/");
      const index = this.identifier.uri.with({ path: root + "/index.json" });

      let json = await this.fetchIndex(index.toString());

      const prefix = remainders.join("/") + "/";
      json = json.filter((path) => path.startsWith(prefix));
      json = json.map((path) => path.substring(prefix.length));
      if (!json.length) {
        return "not-found" as "not-found";
      }
      return this.getNewYDocFromDir(json);
    }
  }

  private async initializeNoCatch() {
    try {
      const docData = await this.getNewYDocFromFetch();
      if (this.disposed) {
        console.warn("already disposed");
        return;
      }
      if (docData === "not-found") {
        runInAction(() => {
          this.status = "not-found";
        });
        return;
      }
      runInAction(() => {
        this.status = "loaded";
        const update = Y.encodeStateAsUpdateV2(docData);
        Y.applyUpdateV2(this._ydoc, update, this);
      });
      this._ydoc.on("update", this.documentUpdateListener);
      this._register({
        dispose: () => {
          this._ydoc.off("update", this.documentUpdateListener);
        },
      });
    } catch (e) {
      console.error(e);
      runInAction(() => {
        this.status = "loading";
      }); // TODO: error state?
    }
  }

  public load(): Promise<void> {
    return this.initialize();
  }

  public dispose() {
    this.disposed = true;
    super.dispose();
  }
}
