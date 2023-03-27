import {
  Database,
  DatabaseConfiguration,
} from "@hocuspocus/extension-database";
import {
  fetchPayload,
  onAuthenticatePayload,
  storePayload,
} from "@hocuspocus/server";

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
        console.log("fetch");
        return null;
      },
      store: async (data: storePayload) => {
        console.log("store");
      },
    });
  }

  async onAuthenticate(data: onAuthenticatePayload) {
    console.log("authx");
    // throw new Error("nope");
  }
}
