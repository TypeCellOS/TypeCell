import { makeObservable, observable, runInAction } from "mobx";
import { lifecycle } from "vscode-lib";
import * as Y from "yjs";
import { GithubIdentifier } from "../../identifiers/GithubIdentifier";
import { getFileOrDirFromGithub } from "../../integrations/github/github";
import { markdownToYDoc } from "../../integrations/markdown/import";
import ProjectResource from "../ProjectResource";
import { SyncManager } from "./SyncManager";

export default class GithubSyncManager
  extends lifecycle.Disposable
  implements SyncManager
{
  public canWrite: boolean = true; // always initialize as true until the user starts trying to make changes

  public doc: "loading" | "not-found" | Y.Doc = "loading";

  public readonly webrtcProvider = undefined;

  public constructor(private identifier: GithubIdentifier) {
    super();
    makeObservable(this, {
      doc: observable.ref,
      canWrite: observable.ref,
    });
  }

  private documentUpdateListener = async (update: any, origin: any) => {
    if (origin === this) {
      // these are updates that came in from MatrixProvider
      return;
    }
    if (origin?.provider) {
      // update from peer (e.g.: webrtc / websockets). Peer is responsible for sending to Matrix
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
    const project = new ProjectResource(newDoc, this.identifier);
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
      if (docData === "not-found") {
        this.doc = "not-found";
        return;
      }
      this.doc = docData;
      this.doc.on("update", this.documentUpdateListener);
    } catch (e) {
      console.error(e);
      this.doc = "loading"; // TODO: error state?
    }
  }

  public dispose() {
    super.dispose();
    if (typeof this.doc !== "string") {
      this.doc.off("update", this.documentUpdateListener);
    }
    this.doc = "loading";
  }
}
