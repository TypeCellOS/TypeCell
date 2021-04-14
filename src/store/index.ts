import { autorun, createAtom, IAtom, observable } from "mobx";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { observeYType } from "../moby";
import { observeDoc } from "../moby/doc";
import * as monaco from "monaco-editor";
import { VscThumbsdown } from "react-icons/vsc";

// backrefs: [
//     {namespace: "@workspace", owner: "project", type: "child", doc: "root"}
//   ]

// type Ref = {
//   namespace: string // @yousefed/renderer
//   type: string; //

// };

function hash(str: string) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var character = str.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export class Ref {
  public constructor(
    public readonly namespace: string,
    public readonly type: string,
    public readonly target: string,
    private oneToMany: boolean,
    private reverseInfo: {
      oneToMany: boolean;
      type: string;
    }
  ) {
    if (!namespace || !type || !target || !reverseInfo) {
      throw new Error("invalid arguments for ref");
    }
  }

  public uniqueHash(): number {
    let hashcode = hash(this.namespace) ^ hash(this.type);

    if (this.oneToMany) {
      hashcode = hashcode ^ hash(this.target);
    }
    return hashcode;
  }

  public reverse(source: string): Ref {
    return new Ref(
      this.namespace,
      this.reverseInfo.type,
      source,
      this.reverseInfo.oneToMany,
      {
        oneToMany: this.oneToMany,
        type: this.type,
      }
    );
  }

  public toJS() {
    return {
      namespace: this.namespace,
      type: this.type,
      target: this.target,
    };
  }
}

/*

why does ydoc support root elements? such as getMap() and getArray(). But why not a root subdoc?


Learnings:
- types are not overwritten when synced (1 client sets a different type than other client)
- 

*/

const documentCache = new Map<string, TCDocument>();
(window as any).documents = documentCache;
const subDocCache = new Map<string, Y.Doc>();

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

    // this.reportMapKeyAtom("titlemap", this.meta, "title");
    // if (
    //   !title ||
    //   !(title instanceof Y.Text) /* TODO: warning if not correct type */
    // ) {
    //   title = new Y.Text("");
    //   this.meta.set("title", title);
    // }
    // this.reportTextAtom("title", title);
    return title;
  }

  public get type(): string {
    // this.reportMapKeyAtom("typemap", this.meta, "type");
    return this.ydoc.getMap("meta").get("type");
  }

  public set type(val: string) {
    this.ydoc.getMap("meta").set("type", val);
  }

  public get refs(): Y.Map<any> {
    let map: Y.Map<any> = this.ydoc.getMap("refs"); // TODO: or default check if text
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

// observableYMap( {
//   array: [],
//   arr: Y.array,
//   s: "",
//   x: Y.Text,
// }

// const provider2 = new WebrtcProvider("example-document2", ydoc);

// const docRoot = ydoc.getXmlFragment("cells");

// ydoc.on("update", (update: any) => {
//   // Y.applyUpdate(doc2, update)
//   console.log(ydoc.toJSON());
// });

// export function getDoc(id: string) {
//   const ydoc = new Y.Doc({});
//   const provider = new WebrtcProvider("id", ydoc);
// }

/*
url: typecell.com/@yousefed/project
guid: [project]
{
  title,
  type: @yousefed/template-project ---> modifies data.children
  backlinks: [], // race conditions?
  // deletedlinks: [],
  data: { // subdoc
    cells: "<empty>",
    children: [
      {
        id: "page123" // subdoc
      }
    ]
  }
}

guid: [project/cells]
<typecell
- render sidebar
- handle urls, handle document
>


url: typecell.com/@yousefed/project/page
- refs: [parent]


// global index vs*/

(window as any).test1 = function (id: string) {
  (window as any).ydoc = new Y.Doc({ guid: id });
  (window as any).indexedDBProvider = new IndexeddbPersistence(id, this.ydoc);
};
(window as any).load = TCDocument.load;
