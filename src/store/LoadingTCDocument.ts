import { generateKeyBetween } from "fractional-indexing";
import slug from "speakingurl";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import { observeDoc } from "../moby/doc";
import {
  createRef,
  getHashForReference,
  Ref,
  ReferenceDefinition,
  reverseReferenceDefinition,
  validateRef,
} from "./Ref";
import TCDocument from "./TCDocument";

const documentCache = new Map<string, LoadingTCDocument>();
// (window as any).documents = documentCache;
// const subDocCache = new Map<string, Y.Doc>();

export default class LoadingTCDocument {
  private _refCount = 0;
  private readonly _ydoc;
  public readonly webrtcProvider: WebrtcProvider;
  public readonly indexedDBProvider: IndexeddbPersistence;

  private constructor(
    public readonly id: string,
    private readonly _initialTitle?: string
  ) {
    if (!id.startsWith("@") || id.split("/").length !== 2) {
      throw new Error("invalid arguments for doc");
    }

    this._ydoc = new Y.Doc({ guid: id });
    this.webrtcProvider = new WebrtcProvider(id, this._ydoc);
    this.indexedDBProvider = new IndexeddbPersistence(id, this._ydoc);

    observeDoc(this._ydoc);
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
    doc._refCount++;
    return doc;
  }

  private get _type(): string {
    return this._ydoc.getMap("meta").get("type");
  }

  private _loadedDoc: TCDocument | undefined;

  public get doc() {
    if (this._type) {
      this._loadedDoc = this._loadedDoc || new TCDocument(this, this._ydoc);
      return this._loadedDoc;
    }
    if (this._loadedDoc) {
      throw new Error("has loaded doc, but no type");
    }
    return undefined;
  }

  public create(type: string) {
    this._ydoc.getMap("meta").set("type", type);
    this._ydoc.getMap("meta").set("created_at", Date.now());
  }

  private get _refs(): Y.Map<any> {
    let map: Y.Map<any> = this._ydoc.getMap("refs");
    return map;
  }

  public getRefs(definition: ReferenceDefinition) {
    const ret: Ref[] = []; // TODO: type
    // this._ydoc.getMap("refs").forEach((val, key) => {
    //   this._ydoc.getMap("refs").delete(key);
    // });
    this._ydoc.getMap("refs").forEach((val) => {
      if (
        val.namespace !== definition.namespace ||
        val.type !== definition.type
      ) {
        // filter
        return;
      }
      if (!validateRef(val, definition)) {
        throw new Error("unexpected");
      }
      if (
        val.namespace === definition.namespace &&
        val.type === definition.type
      ) {
        ret.push(val);
      }
    });

    ret.sort((a, b) => ((a.sortKey || "") < (b.sortKey || "") ? -1 : 1));
    return ret;
  }

  public getRef(definition: ReferenceDefinition, key: string) {
    const ref = this._refs.get(key);
    if (ref && !validateRef(ref, definition)) {
      throw new Error("unexpected"); // ref with key exists, but doesn't conform to definition
    }
    return ref;
  }

  public removeRef(definition: ReferenceDefinition, targetId: string) {
    this._refs.delete(getHashForReference(definition, targetId));
    // TODO: delete reverse?
  }

  public moveRef(
    definition: ReferenceDefinition,
    targetId: string,
    index: number
  ) {
    const key = getHashForReference(definition, targetId);
    let existing = this.getRef(definition, key);
    if (!existing) {
      throw new Error("ref not found");
    }

    if (
      definition.relationship.type === "unique" ||
      !definition.relationship.sorted
    ) {
      throw new Error("called moveRef on non sorted definition");
    }

    const refs = this.getRefs(definition);
    const sortKey = generateKeyBetween(
      index === 0 ? null : refs[index - 1].sortKey || null,
      index >= refs.length ? null : refs[index].sortKey || null
    );
    this._refs.set(key, createRef(definition, targetId, sortKey));
  }

  public ensureRef(
    definition: ReferenceDefinition,
    targetId: string,
    index?: number,
    checkReverse = true
  ) {
    // const ref = new Ref(definition, targetId);

    const key = getHashForReference(definition, targetId);
    let existing = this.getRef(definition, key);
    if (existing) {
      // The document already has this relationship
      if (existing.target !== targetId) {
        // The relationship that exists is different, remove the reverse relationship
        const doc = LoadingTCDocument.load(existing.target); // TODO: unload document
        doc.removeRef(reverseReferenceDefinition(definition), this.id);
      }
    }
    // Add the relationship
    let sortKey: string | undefined;

    if (
      definition.relationship.type === "many" &&
      definition.relationship.sorted
    ) {
      const refs = this.getRefs(definition).filter(
        (r) => r.target !== targetId
      );
      if (index === undefined) {
        // append as last item
        sortKey = generateKeyBetween(refs.pop()?.sortKey || null, null);
      } else {
        let sortKeyA = index === 0 ? null : refs[index - 1].sortKey || null;
        let sortKeyB =
          index >= refs.length ? null : refs[index].sortKey || null;
        if (sortKeyA === sortKeyB && sortKeyA !== null) {
          console.warn("unexpected");
          sortKeyB = null;
        }
        sortKey = generateKeyBetween(sortKeyA, sortKeyB);
      }
    }

    this._refs.set(key, createRef(definition, targetId, sortKey));
    if (checkReverse) {
      // Add the reverse relationship
      const reverseDoc = LoadingTCDocument.load(targetId); // TODO: unload document
      reverseDoc.ensureRef(
        reverseReferenceDefinition(definition),
        this.id,
        undefined,
        false
      );
    }
  }

  // public get cellList() {}

  public dispose() {
    this._refCount--;
    if (this._refCount === 0) {
      this.webrtcProvider.destroy();
      this.indexedDBProvider.destroy();
      documentCache.delete(this.id);
    }
  }
}
