import { autorun } from "mobx";
import { VscDebugConsole } from "react-icons/vsc";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import { observeDoc } from "../moby/doc";
import { Ref } from "./Ref";
import slug from "speakingurl";
import TCDocument from "./TCDocument";

const documentCache = new Map<string, LoadingTCDocument>();
// (window as any).documents = documentCache;
// const subDocCache = new Map<string, Y.Doc>();

export default class LoadingTCDocument {
  private refCount = 0;
  private readonly ydoc;
  public readonly webrtcProvider: WebrtcProvider;
  public readonly indexedDBProvider: IndexeddbPersistence;

  private constructor(
    public readonly id: string,
    private readonly initialTitle?: string
  ) {
    if (!id.startsWith("@") || id.split("/").length !== 2) {
      throw new Error("invalid arguments for doc");
    }

    this.ydoc = new Y.Doc({ guid: id });
    this.webrtcProvider = new WebrtcProvider(id, this.ydoc);
    this.indexedDBProvider = new IndexeddbPersistence(id, this.ydoc);

    observeDoc(this.ydoc);
  }

  public static load(
    identifier:
      | string
      | { owner: string; document: string; setInitialTitle?: boolean }
  ) {
    let initialTitleToSet: string | undefined;

    if (typeof identifier !== "string") {
      const ownerSlug = slug(identifier.owner, {
        custom: {
          "@": "@", // tODO: necesary?
        },
      });
      const documentSlug = slug(identifier.document);
      if (!ownerSlug || !documentSlug) {
        throw new Error("invalid identifier");
      }

      if (!ownerSlug.startsWith("@")) {
        throw new Error("currently expecting owner to start with @");
      }

      if (identifier.setInitialTitle) {
        initialTitleToSet = identifier.document;
      }
      identifier = ownerSlug + "/" + documentSlug;
    }

    let doc = documentCache.get(identifier);
    if (!doc) {
      doc = new LoadingTCDocument(identifier);
      documentCache.set(identifier, doc);
      if (initialTitleToSet) {
        // doc.initialTitle = initialTitleToSet; // TODO
      }
    }
    doc.refCount++;
    return doc;
  }

  private get type(): string {
    return this.ydoc.getMap("meta").get("type");
  }

  private _loadedDoc: TCDocument | undefined;

  public get doc() {
    if (this.type) {
      this._loadedDoc = this._loadedDoc || new TCDocument(this, this.ydoc);
      return this._loadedDoc;
    }
    if (this._loadedDoc) {
      throw new Error("has loaded doc, but no type");
    }
    return undefined;
  }

  public create(type: string) {
    this.ydoc.getMap("meta").set("type", type);
    this.ydoc.getMap("meta").set("created_at", Date.now());
  }

  public get refs(): Y.Map<any> {
    let map: Y.Map<any> = this.ydoc.getMap("refs");
    return map;
  }

  public removeRef(ref: Ref) {
    this.refs.delete(ref.uniqueHash() + "");
    // TODO: delete reverse?
  }

  public ensureRef(ref: Ref, checkReverse = true) {
    if (!(ref instanceof Ref)) {
      throw new Error("invalid ref passed");
    }
    const key = ref.uniqueHash() + ""; // parent: type,  // child: type, target
    let existing = this.refs.get(key);
    if (existing) {
      // already has a parent
      if (JSON.stringify(existing) !== JSON.stringify(ref.toJS())) {
        // TODO: deepequals
        // different parent
        const doc = LoadingTCDocument.load(existing.target); // TODO: unload document
        doc.removeRef(ref.reverse(this.id));
      }
    }
    this.refs.set(ref.uniqueHash() + "", ref.toJS());
    if (checkReverse) {
      const reverseDoc = LoadingTCDocument.load(ref.target); // TODO: unload document
      reverseDoc.ensureRef(ref.reverse(this.id), false);
    }
  }

  // public get cellList() {}

  public dispose() {
    this.refCount--;
    if (this.refCount === 0) {
      this.webrtcProvider.destroy();
      this.indexedDBProvider.destroy();
      documentCache.delete(this.id);
    }
  }
}
