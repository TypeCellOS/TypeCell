import { beforeAll, describe, expect, it } from "vitest";
import { createAnonClient, createServiceClient } from "../supabase/supabase";
import { createRandomUser } from "./supabaseTestUtil";

describe("supabase basics", () => {
  beforeAll(async () => {
    // await resetSupabaseDB();
    // await stopSupabase();
    // await startSupabase();
  });
  it("anon: should be able to sign up", async () => {
    const data = await createRandomUser("alice");
    expect(data.user).not.toBeNull();
    expect(data.session).not.toBeNull();
  });

  it("anon: should not be able to create user via admin", async () => {
    const supabase = await createAnonClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: `user2-${Date.now()}@emailasdf.com`,
      password: "password-2",
      user_metadata: { name: "test" },
    });
    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
  });

  it("admin: should be able to create a user", async () => {
    const supabase = await createServiceClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: `user2-${Date.now()}@emailasdf.com`,
      password: "password-2",
      user_metadata: { name: "test" },
    });
    expect(error).toBeNull();
    expect(data.user).not.toBeNull();
  });
});
