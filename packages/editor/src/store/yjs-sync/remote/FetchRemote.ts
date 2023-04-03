import { makeObservable, observable, runInAction } from "mobx";
import { strings } from "vscode-lib";
import { Awareness } from "y-protocols/awareness";

import * as Y from "yjs";
import { HttpsIdentifier } from "../../../identifiers/HttpsIdentifier";
import { markdownToYDoc } from "../../../integrations/markdown/import";
import ProjectResource from "../../ProjectResource";
import { Remote } from "./Remote";

export default class FetchRemote extends Remote {
  private disposed = false;
  protected id: string = "fetch";
  public canCreate: boolean = false;

  public canWrite: boolean = true; // always initialize as true until the user starts trying to make changes

  public constructor(
    _ydoc: Y.Doc,
    awareness: Awareness,
    private readonly identifier: HttpsIdentifier
  ) {
    super(_ydoc, awareness);
    makeObservable(this, {
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
        Y.applyUpdateV2(this._ydoc, update);
      });
      this._register({
        dispose: () => {
          this._ydoc.off("update", this.documentUpdateListener);
        },
      });
      // this.doc.on("update", this.documentUpdateListener);
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
