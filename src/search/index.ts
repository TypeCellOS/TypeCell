import { DocConnection } from "../store/DocConnection";
import * as idb from "idb";
import { BroadcastChannel, createLeaderElection } from "broadcast-channel";
import { Disposable } from "../util/vscode-common/lifecycle";


const channel = new BroadcastChannel("typecell-indexer");
const elector = createLeaderElection(channel);

type SearchableBlock = {
  id: string;
  content: string;
};

type SearchableDoc = {
  id: string;
  title: string;
  blocks: SearchableBlock[];
  version: string;
};

function reindexChangedDocs(db: idb.IDBPDatabase) {
  db.transaction();
}

class Indexer extends Disposable {
  private readonly changeFeedDoc: DocConnection = this._register(DocConnection.loadConnection(".changefeed"));
  constructor () {
    super();

    const handle = setInterval(this.reIndex, 5000);
    this._register({
      dispose: () => clearInterval(handle);
    })
  }
}

let indexer: Indexer | undefined;

export async function setupSearch() {
  const db = await idb.openDB("search");
  DocConnection.onDocConnectionAdded((docConnection) => {
    // observe
    // if local change, add change doc
  });

  elector.awaitLeadership().then(() => {
    indexer = new Indexer();
  });
  elector.onduplicate = () => {
    if (elector.isLeader) {
      console.error("duplicate leader");
      indexer?.dispose();
      elector.die();
    }
  };
}
