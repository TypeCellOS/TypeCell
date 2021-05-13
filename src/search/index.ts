import { BroadcastChannel, createLeaderElection } from "broadcast-channel";
import Fuse from "fuse.js";
import * as Y from "yjs";
import { DocConnection } from "../store/DocConnection";
import { DesiredDocumentState, IndexedDocumentState, Indexer } from "./Indexer";

import { getStateVector } from "./util";

const channel = new BroadcastChannel("typecell-indexer");
const elector = createLeaderElection(channel);

export type SearchableBlock = {
  id: string;
  content: string;
};

export type SearchableDoc = {
  id: string;
  title: string;
  blocks: SearchableBlock[];
  version: IndexedDocumentState;
};

const fuse = new Fuse<SearchableDoc>([], {
  keys: ["title", "id", "blocks.content"],
});

const changeFeedDoc = DocConnection.loadConnection(".changefeed");

let indexer: Indexer | undefined;

export async function setupSearch() {
  // const db = await idb.openDB("search");
  DocConnection.onDocConnectionAdded((docConnection) => {
    docConnection._ydoc.on(
      "afterAllTransactions",
      (doc: Y.Doc, transactions: Y.Transaction[]) => {
        if (
          transactions.find(
            (t) =>
              t.local &&
              t.origin &&
              (t.changed.size || t.deleteSet.clients.size)
          )
        ) {
          const stateVector = getStateVector(doc.store)[doc.clientID];
          if (!stateVector) {
            console.error("unexpected, stateVector not found");
            return;
          }

          const state: DesiredDocumentState = {
            client: doc.clientID + "",
            clock: stateVector,
          };

          changeFeedDoc._ydoc
            .getMap("documentUpdates")
            .set(docConnection.id, state);
        }
      }
    );
  });

  elector.awaitLeadership().then(() => {
    indexer = new Indexer(changeFeedDoc, fuse);
  });
  elector.onduplicate = () => {
    if (elector.isLeader) {
      console.error("duplicate leader");
      indexer?.dispose();
      elector.die();
    }
  };
}
