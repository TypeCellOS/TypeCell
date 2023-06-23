import { Logger } from "@hocuspocus/extension-logger";
import { Server } from "@hocuspocus/server";
import * as dotenv from "dotenv";
import { SupabaseHocuspocus } from "./hocuspocus/extension-supabase/SupabaseHocuspocus.js";

console.log("pre", process.env.VITE_TYPECELL_SUPABASE_SERVICE_KEY);
if (process.env.MODE === "development") {
  dotenv.config({ path: ".env.development" });
} else if (process.env.MODE === "staging") {
  dotenv.config({ path: ".env.staging" });
} else if (process.env.MODE === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  throw new Error(
    "Invalid MODE, run with env MODE=development|staging|production"
  );
}
console.log("post", process.env.VITE_TYPECELL_SUPABASE_SERVICE_KEY);

const server = Server.configure({
  extensions: [new Logger(), new SupabaseHocuspocus({})],
});

server.listen(parseInt(process.env.PORT));
