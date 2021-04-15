import { autorun } from "mobx";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import { observeDoc } from "../moby/doc";
import { Ref } from "./Ref";

const documentCache = new Map<string, TCDocument>();
// (window as any).documents = documentCache;
// const subDocCache = new Map<string, Y.Doc>();

export default class TCDocument {
  private refCount = 0;
  private readonly ydoc;
  public readonly webrtcProvider: WebrtcProvider;
  public readonly indexedDBProvider: IndexeddbPersistence;

  private constructor(
    public readonly id: string,
    initialType: string = "!initializing"
  ) {
    this.ydoc = new Y.Doc({ guid: id });
    this.webrtcProvider = new WebrtcProvider(id, this.ydoc);
    this.indexedDBProvider = new IndexeddbPersistence(id, this.ydoc);

    observeDoc(this.ydoc);

    // this.webrtcProvider.on("synced", () => {
    autorun(() => {
      if (
        !this.type &&
        initialType !== "!initializing" &&
        this.type !== initialType
      ) {
        this.type = initialType;
      }
    });
    // });
  }

  public static load(id: string, initialType?: string) {
    let doc = documentCache.get(id);
    if (!doc) {
      doc = new TCDocument(id, initialType);
      documentCache.set(id, doc);
    }
    doc.refCount++;
    return doc;
  }

  public get title(): Y.Text {
    let title: Y.Text = this.ydoc.getText("title");
    return title;
  }

  public get type(): string {
    return this.ydoc.getMap("meta").get("type");
  }

  public set type(val: string) {
    this.ydoc.getMap("meta").set("type", val);
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
        const doc = TCDocument.load(existing.target); // TODO: unload document
        doc.removeRef(ref.reverse(this.id));
      }
    }
    this.refs.set(ref.uniqueHash() + "", ref.toJS());
    if (checkReverse) {
      const reverseDoc = TCDocument.load(ref.target);
      reverseDoc.ensureRef(ref.reverse(this.id), false);
    }
  }

  public get data(): Y.XmlFragment {
    let xml = this.ydoc.getXmlFragment("doc");
    // observeYType(subDoc);
    return xml;
    // subDoc.load();
    // return subDoc;
  }

  public dispose() {
    this.refCount--;
    if (this.refCount === 0) {
      this.webrtcProvider.destroy();
      this.indexedDBProvider.destroy();
      documentCache.delete(this.id);
    }
  }
}
