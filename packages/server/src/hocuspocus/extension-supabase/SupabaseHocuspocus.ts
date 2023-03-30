import {
  Database,
  DatabaseConfiguration,
} from "@hocuspocus/extension-database";
import {
  fetchPayload,
  onAuthenticatePayload,
  storePayload,
} from "@hocuspocus/server";
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
}
