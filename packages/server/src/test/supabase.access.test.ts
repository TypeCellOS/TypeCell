import { beforeAll, describe, expect, it } from "vitest";
import { createAnonClient } from "../supabase/supabase";
import { generateId } from "../util/uniqueId";
import { createRandomUser } from "./supabaseTestUtil";

function createDocument(userId: string, data: string, publicDocument = false) {
  const date = JSON.stringify(new Date());
  return {
    created_at: date,
    updated_at: date,
    data: JSON.stringify(data),
    nano_id: generateId(),
    public_access_level: publicDocument ? "write" : "no-access",
    user_id: userId,
  } as const;
}

describe("supabase access tests", () => {
  let alice: Awaited<ReturnType<typeof createRandomUser>>;
  let bob: Awaited<ReturnType<typeof createRandomUser>>;

  beforeAll(async () => {
    alice = await createRandomUser("alice");
    bob = await createRandomUser("bob");
    // await resetSupabaseDB();
    // await stopSupabase();
    // await startSupabase();
  });
  it("alice: should be able to change name", async () => {
    const ret = await alice.supabase.auth.updateUser({
      data: {
        customValue: 24,
      },
    });
    expect(ret.error).toBeNull();
    expect(ret.data.user!.user_metadata.customValue).toBe(24);
  });

  it("anon: should not be able to create document", async () => {
    const supabase = await createAnonClient();
    const ret = await supabase
      .from("documents")
      .insert(createDocument(alice.user!.id, "hello"));

    expect(ret.error).not.toBeNull();
  });

  it("alice: should be able to create private document", async () => {
    const ret = await alice.supabase
      .from("documents")
      .insert(createDocument(alice.user!.id, "hello"));
    console.log(ret.error);
    expect(ret.error).toBeNull();
  });

  it("alice: should not be able to create private document for someone else", async () => {
    const ret = await alice.supabase
      .from("documents")
      .insert(createDocument(bob.user!.id, "hello"));
    console.log(ret.error);
    expect(ret.error).not.toBeNull();
  });

  it("bob: should be able to read public document by alice", async () => {
    const ret = await alice.supabase
      .from("documents")
      .insert(createDocument(alice.user!.id, "hello", true))
      .select();

    const retByBob = await bob.supabase
      .from("documents")
      .select()
      .eq("id", ret.data![0].id);

    expect(retByBob.data?.length).toBe(1);
  });

  it("bob: should not be able to read private document by alice", async () => {
    const ret = await alice.supabase
      .from("documents")
      .insert(createDocument(alice.user!.id, "hello"))
      .select();

    console.log(ret.data![0].id);
    const retByBob = await bob.supabase
      .from("documents")
      .select()
      .eq("id", ret.data![0].id);

    expect(retByBob.data?.length).toBe(0);
  });
});
