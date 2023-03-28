import {
  Database,
  DatabaseConfiguration,
} from "@hocuspocus/extension-database";
import {
  fetchPayload,
  onAuthenticatePayload,
  storePayload,
} from "@hocuspocus/server";
import { createAnonClient } from "../../supabase/supabase";

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
  constructor(configuration?: Partial<SupabaseConfiguration>) {
    super({
      fetch: async (data: fetchPayload) => {
        return null;
      },
      store: async (data: storePayload) => {
        console.log("store");
      },
    });
  }

  async onAuthenticate(data: onAuthenticatePayload) {
    const [access_token, refresh_token] = data.token.split("$");
    const supabase = await createAnonClient();
    await supabase.auth.setSession({ access_token, refresh_token });

    const ret = await supabase
      .from("documents")
      .update({ updated_at: JSON.stringify(new Date()) })
      .eq("nano_id", data.documentName);

    if (ret.error) {
      // we couldn't update, perhaps it's readonly?
    }
    // throw new Error("nope");
  }
}
