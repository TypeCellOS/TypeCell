import { IndexeddbPersistence } from "y-indexeddb";

export async function existsLocally(idbIdentifier: string) {
  const exists = (await (window.indexedDB as any).databases())
    .map((db: IDBDatabase) => db.name)
    .includes(idbIdentifier);
  return exists;
}

export function getIDBIdentifier(docId: string, userId: string | undefined) {
  const prefix = userId ? "u-" + userId : "guest";
  return `tc-yjs-${prefix}-${docId}`;
}

export async function waitForIDBSynced(
  indexedDBProvider: IndexeddbPersistence
) {
  await new Promise<void>((resolve) => {
    indexedDBProvider.once("synced", () => {
      resolve();
    });
  });
}
