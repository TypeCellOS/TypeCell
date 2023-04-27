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

export interface SupabaseConfiguration extends DatabaseConfiguration {}

export class SupabaseHocuspocus extends Database {
  private supabase: Awaited<ReturnType<typeof createAnonClient>> | undefined;

  constructor(configuration?: Partial<SupabaseConfiguration>) {
    super({
      fetch: async (data: fetchPayload) => {
        console.log("fetch");
        if (!this.supabase) {
          throw new Error("unexpected: no db client on fetch");
        }

        const ret = await this.supabase
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
        console.log("store");
        if (!this.supabase) {
          throw new Error("unexpected: no db client on store");
        }

        const ret = await this.supabase
          .from("documents")
          .update(
            { data: "\\x" + data.state.toString("hex") }, // add \x for postgres binary data
            { count: "exact" }
          )
          .eq("nano_id", data.documentName)
          .select();
        if (ret.data?.length !== 1) {
          throw new Error("unexpected: not found when storing");
        }
      },
    });
  }

  async onAuthenticate(data: onAuthenticatePayload) {
    if (data.documentName.length < 5) {
      throw new Error("invalid document name");
    }
    console.log("authenticate " + data.documentName);

    const [access_token, refresh_token] = data.token.split("$");

    if (!access_token || !refresh_token) {
      throw new Error("invalid token");
    }

    this.supabase = await createAnonClient();
    await this.supabase.auth.setSession({ access_token, refresh_token });

    const ret = await this.supabase
      .from("documents")
      .update({ updated_at: JSON.stringify(new Date()) }, { count: "exact" })
      .eq("nano_id", data.documentName);

    if (ret.count === 1) {
      // document exists and was able to update it, so has write access
      return;
    }

    // we couldn't update, perhaps it's readonly?
    const ret2 = await this.supabase
      .from("documents")
      .select()
      .eq("nano_id", data.documentName);

    if (ret2.count === 1) {
      // document exists, but user only has read access
      data.connection.readOnly = true;
      return;
    }

    // check with service account if document exists
    const adminClient = await createServiceClient();
    const retAdmin = await adminClient
      .from("documents")
      .select()
      .eq("nano_id", data.documentName);

    if (retAdmin.count === 1) {
      // document exists, but user has no access
      throw new Error("no access");
    }
    // document doesn't exist, user should create it first
    throw new Error("not found");
  }

  // TODO: lock this function with a mutex?
  refsChanged = async (
    documentId: string,
    event: Y.YEvent<any>[],
    tr: Y.Transaction
  ) => {
    if (!this.supabase) {
      throw new Error("unexpected: no db client on store");
    }

    if (!documentId) {
      throw new Error("unexpected: no documentId on context");
    }

    const children = await this.supabase
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
      const ret = await this.supabase
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
      const ret = await this.supabase
        .from("document_relations")
        .insert(toAdd.map((e) => ({ parent_id: documentId, child_id: e })));

      if (ret.error) {
        throw new Error(
          "error executing supabase request (add) " + ret.error.message
        );
      }
    }
  };

  async onLoadDocument(data: onLoadDocumentPayload): Promise<any> {
    if (data.context.refListener) {
      throw new Error("unexpected: refListener already set");
    }
    await super.onLoadDocument(data);

    data.context.refListener = (event: Y.YEvent<any>[], tr: Y.Transaction) =>
      this.refsChanged(data.context.documentId, event, tr);
    data.document.getMap("refs").observeDeep(data.context.refListener);
  }

  async onDisconnect?(data: onDisconnectPayload): Promise<any> {
    if (data.clientsCount === 0) {
      if (data.context.refListener) {
        throw new Error("unexpected: refListener not set");
      }
      data.document.getMap("refs").unobserveDeep(data.context.refListener);
      delete data.context.refListener;
    }
  }
}
