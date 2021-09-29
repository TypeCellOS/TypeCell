import * as _ from "lodash";
import { makeObservable, observable } from "mobx";
import * as Y from "yjs";
import { readFile, saveFile, Watcher } from "filebridge-client";
import { markdownToNotebook } from "../../integrations/github/markdown";
import { FileIdentifier } from "../../identifiers/FileIdentifier";
import { uniqueId } from "@typecell-org/common";
import { lifecycle } from "vscode-lib";

import ProjectResource from "../ProjectResource";
import { xmlFragmentToMarkdown } from "../../integrations/markdown";

function isEmptyDoc(doc: Y.Doc) {
  return areDocsEqual(doc, new Y.Doc());
}

// NOTE: only changes in doc xml fragment are checked
function areDocsEqual(doc1: Y.Doc, doc2: Y.Doc) {
  return _.eq(
    (doc1.getXmlFragment("doc").toJSON() as string).replaceAll(
      /block\-id=".*"/g,
      ""
    ),
    (doc2.getXmlFragment("doc").toJSON() as string).replaceAll(
      /block\-id=".*"/g,
      ""
    )
  );
}

/**
 * Given an identifier, manages local + remote syncing of a Y.Doc
 */
export class YDocFileSyncManager extends lifecycle.Disposable {
  private _ydoc: Y.Doc;
  private watcher: Watcher | undefined;
  public webrtcProvider: any;

  public get canWrite() {
    return true;
  }

  /**
   * Get the managed "doc". Returns:
   * - a Y.Doc encapsulating the loaded doc if available
   * - "not-found" if the document doesn't exist locally / remote
   * - "loading" if we're still loading the document
   *
   * (mobx observable)
   *
   * @type {("loading" | "not-found" | Y.Doc)}
   * @memberof DocConnection
   */
  public doc: "loading" | "not-found" | Y.Doc = "loading";

  public constructor(public readonly identifier: FileIdentifier) {
    super();
    makeObservable(this, {
      doc: observable.ref,
    });

    console.log("new docconnection", this.identifier.toString());
    this._ydoc = new Y.Doc({ guid: this.identifier.toString() });
  }

  private async getNewYDocFromDir() {
    const newDoc = new Y.Doc();
    newDoc.getMap("meta").set("type", "!project");
    const project = new ProjectResource(newDoc, this.identifier);

    this.watcher = this._register(
      new Watcher(this.identifier.path + "/**/*.md")
    );
    this._register(
      this.watcher.onWatchEvent(async (e) => {
        if (e.event === "add") {
          project.files.set(e.path, {});
        } else if (e.event === "unlink") {
          project.files.delete(e.path);
        }
      })
    );
    this._ydoc = this.doc = newDoc;
    return newDoc;
  }

  private async getNewYDocFromId() {
    const ret = await readFile(this.identifier.path);
    if (ret.type === "file") {
      await this.getNewYDocFromFile(ret.contents);
    } else {
      await this.getNewYDocFromDir();
    }
  }

  private getYDocFromContents(contents: string) {
    const nbData = markdownToNotebook(contents);
    const newDoc = new Y.Doc();
    newDoc.getMap("meta").set("type", "!notebook");

    let xml = newDoc.getXmlFragment("doc");
    const elements = nbData.map((cell) => {
      const element = new Y.XmlElement("typecell");
      element.setAttribute("block-id", uniqueId.generate()); // TODO: do we want random blockids? for markdown sources?

      if (typeof cell === "string") {
        element.insert(0, [new Y.XmlText(cell)]);
        element.setAttribute("language", "markdown");
      } else {
        element.insert(0, [new Y.XmlText(cell.node.value)]);
        element.setAttribute("language", "typescript");
      }

      return element;
    });
    xml.insert(0, elements);
    return newDoc;
  }

  private async getNewYDocFromFile(contents: string) {
    const newDoc = this.getYDocFromContents(contents);

    if (isEmptyDoc(this._ydoc)) {
      const update = Y.encodeStateAsUpdate(newDoc);
      Y.applyUpdate(this._ydoc, update);
      this.doc = this._ydoc;
    } else {
      if (!areDocsEqual(this._ydoc, newDoc)) {
        this._ydoc.destroy();
        this._ydoc = this.doc = newDoc;
      }
    }
    this._ydoc.on("update", this.documentUpdateListener);

    this.watcher = this._register(new Watcher(this.identifier.path));

    this._register(
      this.watcher.onWatchEvent(async (event) => {
        if (event.event !== "change") {
          // TODO: support onlink
          return;
        }
        const file = await readFile(this.identifier.path);
        if (file.type !== "file") {
          throw new Error("unexpected");
        }
        const docData = await this.getNewYDocFromFile(file.contents);
        if (!areDocsEqual(this._ydoc, docData)) {
          this._ydoc.destroy();
          this._ydoc = this.doc = docData;
          this._ydoc.on("update", this.documentUpdateListener);
        }
      })
    );

    return newDoc;
  }

  private getFileFromYDoc(doc: Y.Doc) {
    // const contents = await readFile(this.identifier.path);
    // const nbData = markdownToNotebook(contents);

    if (doc.getMap("meta").get("type") !== "!notebook") {
      throw new Error("invalid type");
    }

    let xml = doc.getXmlFragment("doc");

    return xmlFragmentToMarkdown(xml);
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
    await saveFile(this.identifier.path, this.getFileFromYDoc(this._ydoc));
  };

  public async initialize() {
    try {
      await this.getNewYDocFromId();
    } catch (e) {
      console.error(e);
      this.doc = "not-found";
    }
  }

  public dispose() {
    super.dispose();
    this._ydoc.off("update", this.documentUpdateListener);
  }
}
