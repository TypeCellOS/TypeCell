import * as _ from "lodash";

import * as Y from "yjs";
import { GithubIdentifier } from "../store/Identifier";
import { arrayBuffersAreEqual } from "../util/binaryEqual";
import uniqueId from "../util/uniqueId";
import { Emitter, Event } from "../util/vscode-common/event";
import { Disposable } from "../util/vscode-common/lifecycle";
import { getFileFromGithub } from "./github";
import { markdownToNotebook } from "./markdown";

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

export default class GithubProvider extends Disposable {
  private _canWrite: boolean = true;

  private readonly _onCanWriteChanged: Emitter<void> = this._register(
    new Emitter<void>()
  );
  public readonly onCanWriteChanged: Event<void> =
    this._onCanWriteChanged.event;

  private readonly _onDocumentAvailable: Emitter<void> = this._register(
    new Emitter<void>()
  );
  public readonly onDocumentAvailable: Event<void> =
    this._onDocumentAvailable.event;

  private readonly _onDocumentUnavailable: Emitter<void> = this._register(
    new Emitter<void>()
  );

  private setCanWrite(value: boolean) {
    if (this._canWrite !== value) {
      this._canWrite = value;
      this._onCanWriteChanged.fire();
    }
  }

  public get canWrite() {
    return this._canWrite;
  }

  public readonly onDocumentUnavailable: Event<void> =
    this._onDocumentUnavailable.event;

  public constructor(private doc: Y.Doc, private identifier: GithubIdentifier) {
    super();
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
    this.setCanWrite(false);
  };

  public async initialize() {
    try {
      await this.initializeNoCatch();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  private async getNewYDocFromGithub() {
    const contents = await getFileFromGithub({
      owner: this.identifier.owner,
      path: this.identifier.path,
      repo: this.identifier.repository,
    });
    const nbData = markdownToNotebook(contents);
    const newDoc = new Y.Doc();
    newDoc.getMap("meta").set("type", "!notebook");

    let xml = newDoc.getXmlFragment("doc");
    const elements = nbData.map((cell) => {
      const element = new Y.XmlElement("typecell");
      element.setAttribute("block-id", uniqueId()); // TODO: do we want random blockids? for markdown sources?

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

  private async initializeNoCatch() {
    try {
      const docData = await this.getNewYDocFromGithub();
      if (isEmptyDoc(this.doc)) {
        const update = Y.encodeStateAsUpdate(docData);
        Y.applyUpdate(this.doc, update);
      } else {
        if (!areDocsEqual(this.doc, docData)) {
          this.setCanWrite(false);
        }
      }
      this.doc.on("update", this.documentUpdateListener);
      this._onDocumentAvailable.fire();
    } catch (e) {
      console.error(e);
      this._onDocumentUnavailable.fire();
    }
  }

  public dispose() {
    super.dispose();
    this.doc.off("update", this.documentUpdateListener);
  }
}
