import { readFile, saveFile, Watcher } from "filebridge-client";
import * as _ from "lodash";
import { makeObservable, observable, runInAction } from "mobx";
import { path, strings } from "vscode-lib";
import * as Y from "yjs";
import { filesToTreeNodes } from "../../../app/documentRenderers/project/directoryNavigation/treeNodeUtil";
import { FileIdentifier } from "../../../identifiers/FileIdentifier";
import { getIdentifierWithAppendedPath } from "../../../identifiers/paths/identifierPathHelpers";
import { xmlFragmentToMarkdown } from "../../../integrations/markdown/export";
import { markdownToXmlFragment } from "../../../integrations/markdown/import";
import ProjectResource from "../../ProjectResource";
import { ChildReference } from "../../referenceDefinitions/child";
import { Remote } from "./Remote";

function isEmptyDoc(doc: Y.Doc) {
  return areDocsEqual(doc, new Y.Doc());
}

// NOTE: only changes in doc xml fragment are checked
function areFragmentsEqual(fragment1: Y.XmlFragment, fragment2: Y.XmlFragment) {
  return _.eq(
    (fragment1.toJSON() as string).replaceAll(/block-id=".*"/g, ""),
    (fragment2.toJSON() as string).replaceAll(/block-id=".*"/g, "")
  );
}

function areDocsEqual(doc1: Y.Doc, doc2: Y.Doc) {
  return areFragmentsEqual(
    doc1.getXmlFragment("doc"),
    doc2.getXmlFragment("doc")
  );
}

/**
 * Given an identifier, manages local + remote syncing of a Y.Doc
 */
export class FilebridgeRemote extends Remote {
  private disposed = false;
  protected id: string = "filebridge";
  public canCreate: boolean = false;
  private watcher: Watcher | undefined;

  public canWrite = true;

  public get awareness() {
    return undefined;
  }

  public constructor(
    _ydoc: Y.Doc,
    private readonly identifier: FileIdentifier
  ) {
    super(_ydoc);
    makeObservable(this, {
      canWrite: observable.ref,
    });
  }

  private documentsByPath = new Set<string>();

  private async updateYDocFromDir() {
    const pathWithTrailingSlash = this.identifier.path
      ? strings.trim(this.identifier.path, "/") + "/"
      : "";

    this._ydoc.getMap("meta").set("type", "!project");
    if (this.identifier.path) {
      this._ydoc
        .getMap("meta")
        .set("title", path.basename(this.identifier.path));
    }
    const project = new ProjectResource(this._ydoc, this.identifier); // TODO

    this.watcher = this._register(
      new Watcher(pathWithTrailingSlash + "**/*.md")
    );
    this._register(
      this.watcher.onWatchEvent(async (e) => {
        let path = e.path;
        if (pathWithTrailingSlash && !path.startsWith(pathWithTrailingSlash)) {
          throw new Error("file returned with invalid path");
        }
        path = path.substring(pathWithTrailingSlash.length);

        const oldDocs = [...this.documentsByPath];
        const oldTree = filesToTreeNodes(
          Array.from(oldDocs).map((p) => ({ fileName: p }))
        );

        if (e.event === "add") {
          // project.addRef(ChildReference);
          this.documentsByPath.add(path);
        } else if (e.event === "unlink") {
          this.documentsByPath.delete(path);
          const id = getIdentifierWithAppendedPath(this.identifier, path);
          // TODO: check if this works
          project.removeRef(ChildReference, id);
        }

        const tree = filesToTreeNodes(
          Array.from(this.documentsByPath).map((p) => ({ fileName: p }))
        );

        oldTree.forEach((node) => {
          if (!tree.find((n) => n.fileName === node.fileName)) {
            const id = getIdentifierWithAppendedPath(
              this.identifier,
              node.fileName
            );
            project.removeRef(ChildReference, id);
          }
        });

        tree.forEach((node) => {
          const id = getIdentifierWithAppendedPath(
            this.identifier,
            node.fileName
          );

          project.addRef(ChildReference, id, undefined, false);
        });
      })
    );
  }

  private async updateYDocFromId() {
    const ret = await readFile(
      fetch,
      this.identifier.uri.path,
      "http://" + this.identifier.uri.authority
    );
    if (this.disposed) {
      return;
    }
    if (ret.type === "file") {
      this._ydoc.on("update", this.documentUpdateListener);
      this._register({
        dispose: () => this._ydoc.off("update", this.documentUpdateListener),
      });
      await this.updateYDocFromContents(
        ret.contents,
        path.basename(this.identifier.uri.path)
      );
      await this.updateYDocFromFile();
    } else {
      await this.updateYDocFromDir();
    }
    runInAction(() => {
      this.status = "loaded";
    });
  }

  private async updateYDocFromContents(contents: string, title?: string) {
    this._ydoc.getMap("meta").set("type", "!notebook");
    this._ydoc.getMap("meta").set("title", title);
    const newXml = markdownToXmlFragment(contents, undefined);

    const fragment = this._ydoc.getXmlFragment("doc");

    if (!areFragmentsEqual(fragment, newXml)) {
      const update = Y.encodeStateAsUpdateV2(newXml.doc!);
      Y.applyUpdateV2(this._ydoc, update, this);
    }
  }

  private async updateYDocFromFile() {
    this.watcher = this._register(
      new Watcher(this.identifier.path, "ws://" + this.identifier.uri.authority)
    );

    this._register(
      this.watcher.onWatchEvent(async (event) => {
        if (event.event !== "change") {
          // TODO: support onlink
          return;
        }
        const file = await readFile(
          fetch,
          this.identifier.path,
          "http://" + this.identifier.uri.authority
        );

        if (file.type !== "file") {
          throw new Error("unexpected");
        }
        await this.updateYDocFromContents(file.contents);
      })
    );
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
      // these are updates that came in from this provider
      return;
    }
    if (origin?.provider) {
      // remote update
      return;
    }
    await saveFile(
      fetch,
      this.identifier.path,
      this.getFileFromYDoc(this._ydoc),
      "http://" + this.identifier.uri.authority
    );
  };

  public startSyncing(): Promise<void> {
    return this.initialize();
  }

  public async initialize() {
    try {
      await this.updateYDocFromId();
    } catch (e) {
      console.error(e);
      runInAction(() => {
        this.status = "not-found";
      });
    }
  }

  public dispose() {
    this.disposed = true;
    super.dispose();
  }
}
