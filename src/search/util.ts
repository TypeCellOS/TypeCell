import * as Y from "yjs";

export function stateVectorMapToJS(map: Map<number, number>) {
  let obj = Object.create(null);
  for (let [k, v] of map) {
    obj[k + ""] = v;
  }
  return obj;
}

export function getStateVector(store: Y.Doc["store"]) {
  const sm = new Map();
  store.clients.forEach((structs, client) => {
    const struct = structs[structs.length - 1];
    sm.set(client, struct.id.clock + struct.length);
  });
  return stateVectorMapToJS(sm);
}
