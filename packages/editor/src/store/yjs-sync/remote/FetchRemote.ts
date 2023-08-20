import { makeObservable, observable, runInAction } from "mobx";
import { path, strings } from "vscode-lib";

import { ChildReference, IndexFileReference } from "@typecell-org/shared";
import _ from "lodash";
import * as Y from "yjs";
import { filesToTreeNodes } from "../../../app/documentRenderers/project/directoryNavigation/treeNodeUtil";
import { HttpsIdentifier } from "../../../identifiers/HttpsIdentifier";
import { getIdentifierWithAppendedPath } from "../../../identifiers/paths/identifierPathHelpers";
import { markdownToYDoc } from "../../../integrations/markdown/import";
import ProjectResource from "../../ProjectResource";
import { Remote } from "./Remote";

type IndexFile = {
  title: string;
  items: string[];
};

// function isEmptyDoc(doc: Y.Doc) {
//   return areDocsEqual(doc, new Y.Doc());
// }

// // NOTE: only changes in doc xml fragment are checked
// function areFragmentsEqual(fragment1: Y.XmlFragment, fragment2: Y.XmlFragment) {
//   return _.eq(
//     (fragment1.toJSON() as string).replaceAll(/block-id=".*"/g, ""),
//     (fragment2.toJSON() as string).replaceAll(/block-id=".*"/g, "")
//   );
// }

// function areDocsEqual(doc1: Y.Doc, doc2: Y.Doc) {
//   return areFragmentsEqual(
//     doc1.getXmlFragment("doc"),
//     doc2.getXmlFragment("doc")
//   );
// }

export default class FetchRemote extends Remote {
  private disposed = false;
  protected id = "fetch";
  public canCreate = false;

  public canWrite = true; // always initialize as true until the user starts trying to make changes

  public get awareness() {
    return undefined;
  }

  public constructor(
    _ydoc: Y.Doc,
    private readonly identifier: HttpsIdentifier
  ) {
    super(_ydoc);
    makeObservable(this, {
      canWrite: observable.ref,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private documentUpdateListener = async (update: any, origin: any) => {
    if (origin === this) {
      // these are updates that came in from this provider
      return;
    }
    if (origin?.provider) {
      // remote update
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

  private async getNewYDocFromDir(indexFile: IndexFile) {
    const newDoc = new Y.Doc();
    newDoc.getMap("meta").set("type", "!project");
    newDoc.getMap("meta").set("title", indexFile.title);
    const project = new ProjectResource(newDoc, this.identifier); // TODO

    const tree = filesToTreeNodes(
      indexFile.items.map((object) => ({ fileName: object }))
    );

    tree.forEach((node) => {
      const id = getIdentifierWithAppendedPath(this.identifier, node.fileName);
      project.addRef(ChildReference, id, undefined, false);

      if (node.fileName === "README.md") {
        project.addRef(IndexFileReference, id, undefined, false);
      }
    });

    return newDoc;
  }

  private fetchIndex = _.memoize(async (path: string) => {
    return (await (await fetch(path)).json()) as IndexFile;
  });

  private async getNewYDocFromFetch() {
    if (this.identifier.uri.path.endsWith(".json")) {
      const json = await this.fetchIndex(this.identifier.uri.toString(true));
      return this.getNewYDocFromDir(json);
    } else if (this.identifier.uri.path.endsWith(".md")) {
      const contents = await (
        await fetch(this.identifier.uri.toString(true))
      ).text();

      return markdownToYDoc(
        contents,
        decodeURIComponent(path.basename(this.identifier.uri.path))
      );
    } else {
      // TODO: this is hacky. We should use json from parent route instead. Revise routing?

      const [root, ...remainders] = strings
        .trim(this.identifier.uri.path, "/")
        .split("/");
      const index = this.identifier.uri.with({ path: root + "/index.json" });

      const json = await this.fetchIndex(index.toString());

      let prefix = remainders.join("/"); // + "/";
      if (prefix) {
        prefix = prefix + "/";
        json.title = path.basename(this.identifier.uri.path);
      }
      let items = json.items.filter((path) => path.startsWith(prefix));
      items = items.map((path) => path.substring(prefix.length));
      if (!items.length) {
        return "not-found" as const;
      }
      json.items = items;
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

        Y.applyUpdateV2(this._ydoc, update, this);
      });
      this._ydoc.on("update", this.documentUpdateListener);
      this._register({
        dispose: () => {
          this._ydoc.off("update", this.documentUpdateListener);
        },
      });
    } catch (e) {
      console.error(e);
      runInAction(() => {
        this.status = "loading";
      }); // TODO: error state?
    }
  }

  public startSyncing(): Promise<void> {
    return this.initialize();
  }

  public dispose() {
    this.disposed = true;
    super.dispose();
  }
}
