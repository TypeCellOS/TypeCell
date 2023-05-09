import { makeObservable, observable, runInAction } from "mobx";
import * as Y from "yjs";
import { GithubIdentifier } from "../../../identifiers/GithubIdentifier";
import { getFileOrDirFromGithub } from "../../../integrations/github/github";
import { markdownToYDoc } from "../../../integrations/markdown/import";
import ProjectResource from "../../ProjectResource";
import { Remote } from "./Remote";

export default class GithubRemote extends Remote {
  private disposed = false;
  protected id: string = "github";
  public canCreate: boolean = false;

  public canWrite: boolean = true; // always initialize as true until the user starts trying to make changes

  public get awareness() {
    return undefined;
  }

  public constructor(
    _ydoc: Y.Doc,
    private readonly identifier: GithubIdentifier
  ) {
    super(_ydoc);
    makeObservable(this, {
      canWrite: observable.ref,
    });
  }

  public startSyncing(): Promise<void> {
    return this.initialize();
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

  private async getNewYDocFromGithubDir(
    tree: { type?: string; path?: string }[]
  ) {
    const newDoc = new Y.Doc();
    newDoc.getMap("meta").set("type", "!project");
    const project = new ProjectResource(newDoc, this.identifier, () => {
      throw new Error("not implemented");
    }); // TODO
    tree.forEach((object) => {
      if (object.type === "blob" && object.path?.endsWith(".md")) {
        project.files.set(object.path, {});
      }
    });
    return newDoc;
  }

  private async getNewYDocFromGithub() {
    const object = await getFileOrDirFromGithub({
      owner: this.identifier.owner,
      path: this.identifier.path,
      repo: this.identifier.repository,
    });

    if (object === "not-found") {
      return object;
    } else if (object.type === "file") {
      return markdownToYDoc(object.data);
    } else {
      return this.getNewYDocFromGithubDir(object.tree);
    }
  }

  private async initializeNoCatch() {
    try {
      const docData = await this.getNewYDocFromGithub();
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
        this.status = "not-found"; // TODO: error state?
      });
    }
  }

  public dispose() {
    this.disposed = true;
    super.dispose();
  }
}
