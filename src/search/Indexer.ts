import Fuse from "fuse.js";
import { SearchableDoc } from ".";
import { DocConnection } from "../store/DocConnection";
import { Disposable } from "../util/vscode-common/lifecycle";
import { getStateVector } from "./util";

export type IndexedDocumentState = {
  [client: string]: number;
};

export type DesiredDocumentState = {
  client: string;
  clock: number;
};

export class Indexer extends Disposable {
  private documentsToUpdate = new Set<string>();
  private indexState: {
    [docId: string]: IndexedDocumentState;
  } = {};
  private documentCache = new Map<string, DocConnection>();
  private staleDocumentTimeouts = new Map<string, number>();

  constructor(
    private changeFeedDoc: DocConnection,
    private fuse: Fuse<SearchableDoc>
  ) {
    super();

    const handle = setInterval(this.reIndexPending, 5000);
    this._register({
      dispose: () => clearInterval(handle),
    });

    changeFeedDoc._ydoc
      .getMap("documentUpdates")
      .observe((event, transaction) => {
        event.keysChanged.forEach((key) => {
          this.documentsToUpdate.add(key);
        });
      });
  }

  private reIndexPending = () => {
    this.documentsToUpdate.forEach(this.tryReIndexDoc);
  };

  private tryReIndexDoc = (documentId: string) => {
    const desiredState = this.changeFeedDoc._ydoc
      .getMap("documentUpdates")
      .get(documentId) as DesiredDocumentState;
    const currentState = this.indexState[documentId];
    if (
      currentState &&
      currentState[desiredState.client] >= desiredState.clock
    ) {
      this.documentsToUpdate.delete(documentId);
      return;
    }

    let doc = this.documentCache.get(documentId);
    if (!doc) {
      doc = DocConnection.load(documentId);
      this.documentCache.set(documentId, doc);
    }

    const timeout = this.staleDocumentTimeouts.get(documentId);
    if (timeout) {
      clearTimeout(timeout);
      this.staleDocumentTimeouts.delete(documentId);
    }

    const currentStateVector = getStateVector(doc._ydoc.store);
    if (currentStateVector[desiredState.client] >= desiredState.clock) {
      this.reIndexDoc(doc);

      // keep document alive so we don't reload documents all the time when users are editing
      const timeout = setTimeout(() => {
        doc?.dispose();
        this.staleDocumentTimeouts.delete(documentId);
        this.documentCache.delete(documentId);
      }, 30000) as any as number;
      this.staleDocumentTimeouts.set(documentId, timeout);
    } else {
      // keep waiting for updates, hopefully changes are incoming on next cycle
    }
  };

  private reIndexDoc = (doc: DocConnection) => {
    const currentStateVector = getStateVector(doc._ydoc.store);

    const xmlRoot = doc._ydoc.getXmlFragment("doc");
    if (xmlRoot) {
      const searchDoc: SearchableDoc = {
        id: doc.identifier.id,
        title: "",
        version: currentStateVector,
        blocks: xmlRoot.toArray().map((element) => {
          return {
            id: "",
            content:
              element.toDOM().textContent?.replace(/(<([^>]+)>)/gi, "") || "", // regexp can be removed after https://github.com/yjs/yjs/issues/300 is fixed
          };
        }),
      };
      this.fuse.remove((d) => d.id === doc.identifier.id);
      this.fuse.add(searchDoc);
    }
    this.indexState[doc.identifier.id] = currentStateVector;
    this.documentsToUpdate.delete(doc.identifier.id);
  };

  public dispose() {
    this.documentCache.forEach((doc) => doc.dispose());
    this.documentCache.clear();
    this.staleDocumentTimeouts.forEach((t) => clearTimeout(t));
    super.dispose();
  }
}
