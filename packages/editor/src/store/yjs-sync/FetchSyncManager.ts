import { makeObservable, observable, runInAction } from "mobx";
import { lifecycle, strings } from "vscode-lib";

import * as Y from "yjs";
import { HttpsIdentifier } from "../../identifiers/HttpsIdentifier";
import { markdownToYDoc } from "../../integrations/markdown/import";
import ProjectResource from "../ProjectResource";
import { SyncManager } from "./SyncManager";

export default class FetchSyncManager
  extends lifecycle.Disposable
  implements SyncManager
{
  public canWrite: boolean = true; // always initialize as true until the user starts trying to make changes

  public doc: "loading" | "not-found" | Y.Doc = "loading";

  public readonly awareness: any = undefined;

  public constructor(private identifier: HttpsIdentifier) {
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

  private async getNewYDocFromDir(objects: string[]) {
    const newDoc = new Y.Doc();
    newDoc.getMap("meta").set("type", "!project");
    const project = new ProjectResource(newDoc, this.identifier);
    objects.forEach((object) => {
      if (object.endsWith(".md")) {
        project.files.set(object, {});
      }
    });
    return newDoc;
  }

  private async getNewYDocFromFetch() {
    if (this.identifier.uri.path.endsWith(".json")) {
      const json = await (await fetch(this.identifier.uri.toString())).json();
      return this.getNewYDocFromDir(json);
    } else if (this.identifier.uri.path.endsWith(".md")) {
      const contents = await (
        await fetch(this.identifier.uri.toString())
      ).text();
      return markdownToYDoc(contents);
    } else {
      // TODO: this is hacky. We should use json from parent route instead. Revise routing?
      const [root, ...remainders] = strings
        .trim(this.identifier.uri.path, "/")
        .split("/");
      const index = this.identifier.uri.with({ path: root + "/index.json" });
      let json = (await (await fetch(index.toString())).json()) as string[];

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
      if (docData === "not-found") {
        this.doc = "not-found";
        return;
      }
      this.doc = docData;
      // this.doc.on("update", this.documentUpdateListener);
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

  public on() {}
}
