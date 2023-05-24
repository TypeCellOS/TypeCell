import {
  Database,
  DatabaseConfiguration,
} from "@hocuspocus/extension-database";
import {
  fetchPayload,
  onAuthenticatePayload,
  onDisconnectPayload,
  onLoadDocumentPayload,
  storePayload,
} from "@hocuspocus/server";
import * as Y from "yjs";
import { createAnonClient, createServiceClient } from "../../supabase/supabase";

// export const schema = `CREATE TABLE IF NOT EXISTS "documents" (
//   "name" varchar(255) NOT NULL,
//   "data" blob NOT NULL,
//   UNIQUE(name)
// )`;

// export const selectQuery = `
//   SELECT data FROM "documents" WHERE name = $name ORDER BY rowid DESC
// `;

// export const upsertQuery = `
//   INSERT INTO "documents" ("name", "data") VALUES ($name, $data)
//     ON CONFLICT(name) DO UPDATE SET data = $data
// `;

type SupabaseType = Awaited<ReturnType<typeof createAnonClient>>;

export interface SupabaseConfiguration extends DatabaseConfiguration {}

export class SupabaseHocuspocus extends Database {
  private supabaseMap = new Map<string, SupabaseType>();

  constructor(configuration?: Partial<SupabaseConfiguration>) {
    super({
      fetch: async (data: fetchPayload) => {
        const supabase = this.supabaseMap.get(data.socketId);
        console.log("fetch");
        if (!supabase) {
          throw new Error("unexpected: no db client on fetch");
        }

        const ret = await supabase
          .from("documents")
          .select()
          .eq("nano_id", data.documentName);
        if (ret.data?.length !== 1) {
          throw new Error("unexpected: not found when fetching");
        }

        data.context.documentId = ret.data[0].id;

        const decoded = Buffer.from(ret.data[0].data.substring(2), "hex"); // skip \x
        if (!decoded.length) {
          return null;
        }
        return decoded;
      },
      store: async (data: storePayload) => {
        const supabase = this.supabaseMap.get(data.socketId);
        if (!supabase) {
          throw new Error("unexpected: no db client on fetch");
        }

        const serviceClient = await createServiceClient();

        const ret = await serviceClient
          .from("documents")
          .update(
            { data: "\\x" + data.state.toString("hex") }, // add \x for postgres binary data
            { count: "exact" }
          )
          .eq("nano_id", data.documentName)
          .select();
        if (ret.data?.length !== 1) {
          throw new Error(
            "unexpected: not found when storing " + data.documentName
          );
        }
      },
    });
  }

  async onAuthenticate(data: onAuthenticatePayload) {
    if (data.documentName.length < 5) {
      throw new Error("invalid document name");
    }
    console.log("authenticate ", data.documentName);

    const supabase = await createAnonClient();

    if (!data.token) {
      throw new Error("invalid token");
    } else if (data.token === "guest") {
      // no-op, use anonClient withput session
    } else {
      const [access_token, refresh_token] = data.token.split("$");

      if (!access_token || !refresh_token) {
        throw new Error("invalid token");
      }
      await supabase.auth.setSession({ access_token, refresh_token });
    }

    this.supabaseMap.set(data.socketId, supabase);

    // TODO: find alternative for updated_at
    const ret = await supabase
      .from("documents")
      .update({ updated_at: JSON.stringify(new Date()) }, { count: "exact" })
      .eq("nano_id", data.documentName);

    if (ret.count === 1) {
      // document exists and was able to update it, so has write access
      // console.log("read+write", data.documentName);
      return;
    }

    // we couldn't update, perhaps it's readonly?
    const ret2 = await supabase
      .from("documents")
      .select(undefined, { count: "exact" })
      .eq("nano_id", data.documentName);

    if (ret2.count === 1) {
      // document exists, but user only has read access
      data.connection.readOnly = true;
      console.log("readonly", data.documentName);
      return;
    }

    // check with service account if document exists
    const adminClient = await createServiceClient();
    const retAdmin = await adminClient
      .from("documents")
      .select(undefined, { count: "exact" })
      .eq("nano_id", data.documentName);

    if (retAdmin.count === 1) {
      console.log("no access", retAdmin);
      // document exists, but user has no access
      throw new Error("no access");
    }
    console.log("not found", data.documentName, retAdmin);
    // document doesn't exist, user should create it first
    throw new Error("not found");
  }

  // TODO: lock this function with a mutex?
  refsChanged = async (
    socketId: string,
    documentId: string,
    event: Y.YEvent<any>[],
    tr: Y.Transaction
  ) => {
    const supabase = this.supabaseMap.get(socketId);
    if (!supabase) {
      throw new Error("unexpected: no db client on store");
    }

    if (!documentId) {
      throw new Error("unexpected: no documentId on context");
    }

    const children = await supabase
      .from("document_relations")
      .select("child_id")
      .eq("parent_id", documentId);

    if (!children.data || children.error) {
      throw new Error("failed to fetch rels");
    }
    const existing = new Set(children.data.map((c) => c.child_id));

    const serviceClient = await createServiceClient();

    const refs = [...tr.doc.getMap("refs").values()]
      .filter((r) => r.namespace === "typecell" && r.type === "child")
      .map((r) => r.target as string);

    const refsIds = await serviceClient
      .from("documents")
      .select("id")
      .in("nano_id", refs);

    if (!refsIds.data || refsIds.error) {
      throw new Error("failed to fetch refs");
    }
    const refsSet = new Set(refsIds.data.map((d) => d.id));

    const toRemove: string[] = [];
    const toAdd: string[] = [];
    existing.forEach((e) => {
      // TODO, remove !
      if (!refsSet.has(e)) {
        toRemove.push(e!);
      }
    });

    refsSet.forEach((id) => {
      if (!existing.has(id)) {
        toAdd.push(id);
      }
    });

    if (toRemove.length) {
      const ret = await supabase
        .from("document_relations")
        .delete()
        .eq("parent_id", documentId)
        .in("child_id", toRemove);

      if (ret.error) {
        throw new Error(
          "error executing supabase request (remove) " + ret.error.message
        );
      }
    }

    if (toAdd.length) {
      const ret = await supabase
        .from("document_relations")
        .insert(toAdd.map((e) => ({ parent_id: documentId, child_id: e })));

      if (ret.error) {
        throw new Error(
          "error executing supabase request (add) " + ret.error.message
        );
      }
    }
  };

  private refListenersByDocument = new WeakMap<Y.Doc, any>();

  async onLoadDocument(data: onLoadDocumentPayload): Promise<any> {
    console.log("onLoadDocument", data.documentName);
    if (this.refListenersByDocument.has(data.document)) {
      throw new Error("unexpected: refListener already set");
    }

    const refListener = (event: Y.YEvent<any>[], tr: Y.Transaction) =>
      this.refsChanged(data.socketId, data.context.documentId, event, tr);
    data.document.getMap("refs").observeDeep(refListener);

    this.refListenersByDocument.set(data.document, refListener);

    await super.onLoadDocument(data);
  }

  async onDisconnect?(data: onDisconnectPayload): Promise<any> {
    if (data.clientsCount === 0) {
      const refListener = this.refListenersByDocument.get(data.document);
      if (!refListener) {
        throw new Error("unexpected: refListener not set");
      }

      data.document.getMap("refs").unobserveDeep(refListener);
      this.refListenersByDocument.delete(data.document);
    }
  }

  // async beforeHandleMessage?(data: beforeHandleMessagePayload): Promise<any> {
  //   // console.log("message", data);
  //   return undefined;
  // }
}
