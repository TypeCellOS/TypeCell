import { DocConnection } from "../store/DocConnection";
import * as idb from "idb";

const changeFeedDoc = DocConnection.loadConnection(".changefeed");

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

export async function setupSearch() {
  const db = await idb.openDB("search");
  DocConnection.onDocConnectionAdded((docConnection) => {
    // observe
    // if local change, add change doc
  });
  setInterval(() => reindexChangedDocs(db), 5000);
}
