import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../types/schema";
import { createDocument, createRandomUser } from "./supabaseTestUtil";

// revoke update on documents in schema public from anon;
// grant update(data, is_public, updated_at) on documents in schema public from anon;

describe("supabase update tests", () => {
  let alice: Awaited<ReturnType<typeof createRandomUser>>;
  let bob: Awaited<ReturnType<typeof createRandomUser>>;

  beforeAll(async () => {
    alice = await createRandomUser("alice");
    bob = await createRandomUser("bob");
  });

  /**
   * Ways to secure updates:
   * - https://stackoverflow.com/questions/72756376/supabase-solutions-for-column-level-security
   * - https://discord.com/channels/839993398554656828/1078039838462324868
   * - https://github.com/orgs/supabase/discussions/656#discussioncomment-335362
   *
   * currently using a mix of update grants and triggers (see schema definition in migrations)
   */

  type Row = Database["public"]["Tables"]["documents"]["Row"];
  // create typeof sample policies from rownames
  type PoliciesType = {
    [key in keyof Row]: {
      sampleValue: Row[key];
      checkValue?: Row[key];
      policy: "allowed" | "forbidden" | "only-owner";
    };
  };

  describe("public document", () => {
    const policies: PoliciesType = {
      id: {
        sampleValue: "4a9d2598-a52b-44a6-aad3-5917cd02b8e9",
        policy: "forbidden",
      },
      created_at: {
        sampleValue: "2021-01-01T00:00:00.000Z",
        policy: "forbidden",
      },
      user_id: {
        sampleValue: "4a9d2598-a52b-44a6-aad3-5917cd02b8e9",
        policy: "forbidden",
      },
      nano_id: {
        sampleValue: "hello",
        policy: "forbidden",
      },
      data: {
        sampleValue: "hello",
        policy: "allowed",
        checkValue: "\\x" + Buffer.from("hello").toString("hex"),
      },
      public_access_level: {
        sampleValue: "no-access",
        policy: "only-owner",
      },
      updated_at: {
        sampleValue: "2021-01-01T00:00:00+00:00",
        policy: "allowed",
      },
    };

    describe("owner", () => {
      let docId: string;

      beforeAll(async () => {
        const doc = createDocument(alice.user!.id, "hello", "write");
        const ret = await alice.supabase.from("documents").insert(doc).select();
        expect(ret.error).toBeNull();
        expect(ret.data![0].id).not.toBeNull();
        docId = ret.data![0].id;
      });

      for (const [key, value] of Object.entries(policies)) {
        if (value.policy === "allowed" || value.policy === "only-owner") {
          it(`owner can update ${key}`, async () => {
            const ret = await alice.supabase
              .from("documents")
              .update({ [key]: value.sampleValue })
              .eq("id", docId)
              .select();

            expect(ret.error).toBeNull();
            expect((ret.data as any)![0][key]).toBe(
              value.checkValue || value.sampleValue
            );
          });
        } else if (value.policy === "forbidden") {
          it(`owner can't update ${key}`, async () => {
            const ret = await alice.supabase
              .from("documents")
              .update({ [key]: value.sampleValue })
              .eq("id", docId)
              .select();

            expect(ret.error).not.toBeNull();
            expect(ret.error?.message).toBe(
              "permission denied for table documents"
            );
            expect(ret.data).toBeNull();
          });
        }
      }
    });

    describe("other user", () => {
      let docId: string;

      beforeAll(async () => {
        const doc = createDocument(alice.user!.id, "hello", "write");
        const ret = await alice.supabase.from("documents").insert(doc).select();
        expect(ret.error).toBeNull();
        expect(ret.data![0].id).not.toBeNull();
        docId = ret.data![0].id;
      });

      for (const [key, value] of Object.entries(policies)) {
        if (value.policy === "allowed") {
          it(`other user can update ${key}`, async () => {
            const ret = await bob.supabase
              .from("documents")
              .update({ [key]: value.sampleValue })
              .eq("id", docId)
              .select();

            expect(ret.error).toBeNull();
            expect((ret.data as any)![0][key]).toBe(
              value.checkValue || value.sampleValue
            );
          });
        } else if (
          value.policy === "forbidden" ||
          value.policy === "only-owner"
        ) {
          it(`other user can't update ${key}`, async () => {
            const ret = await bob.supabase
              .from("documents")
              .update({ [key]: value.sampleValue }, { count: "exact" })
              .eq("id", docId)
              .select();

            expect(ret.error).not.toBeNull();
            if (value.policy === "only-owner") {
              expect(ret.count).toBeNull();
              expect(ret.error?.message).toBe(
                "Cannot update column unless auth.uid() = user_id."
              );
            } else {
              expect(ret.error?.message).toBe(
                "permission denied for table documents"
              );
            }

            expect(ret.data).toBeNull();
          });
        }
      }
    });
  });

  describe("private document", () => {
    const policies: PoliciesType = {
      id: {
        sampleValue: "4a9d2598-a52b-44a6-aad3-5917cd02b8e9",
        policy: "forbidden",
      },
      created_at: {
        sampleValue: "2021-01-01T00:00:00.000Z",
        policy: "forbidden",
      },
      user_id: {
        sampleValue: "4a9d2598-a52b-44a6-aad3-5917cd02b8e9",
        policy: "forbidden",
      },
      nano_id: {
        sampleValue: "hello",
        policy: "forbidden",
      },
      data: {
        sampleValue: "hello",
        policy: "only-owner",
        checkValue: "\\x" + Buffer.from("hello").toString("hex"),
      },
      public_access_level: {
        sampleValue: "write",
        policy: "only-owner",
      },
      updated_at: {
        sampleValue: "2021-01-01T00:00:00+00:00",
        policy: "only-owner",
      },
    };

    describe("owner", () => {
      let docId: string;

      beforeAll(async () => {
        const doc = createDocument(alice.user!.id, "hello", "no-access");
        const ret = await alice.supabase.from("documents").insert(doc).select();
        expect(ret.error).toBeNull();
        expect(ret.data![0].id).not.toBeNull();
        docId = ret.data![0].id;
      });

      for (const [key, value] of Object.entries(policies)) {
        if (value.policy === "allowed" || value.policy === "only-owner") {
          it(`owner can update ${key}`, async () => {
            const ret = await alice.supabase
              .from("documents")
              .update({ [key]: value.sampleValue }, { count: "exact" })
              .eq("id", docId)
              .select();

            expect(ret.error).toBeNull();
            expect(ret.count).toBe(1);
            expect((ret.data as any)![0][key]).toBe(
              value.checkValue || value.sampleValue
            );
          });
        } else if (value.policy === "forbidden") {
          it(`owner can't update ${key}`, async () => {
            const ret = await alice.supabase
              .from("documents")
              .update({ [key]: value.sampleValue }, { count: "exact" })
              .eq("id", docId)
              .select();
            expect(ret.count).toBeNull();
            expect(ret.error).not.toBeNull();
            expect(ret.error?.message).toBe(
              "permission denied for table documents"
            );
            expect(ret.data).toBeNull();
          });
        }
      }
    });

    describe("other user", () => {
      let docId: string;

      beforeAll(async () => {
        const doc = createDocument(alice.user!.id, "hello", "no-access");
        const ret = await alice.supabase.from("documents").insert(doc).select();
        expect(ret.error).toBeNull();
        expect(ret.data![0].id).not.toBeNull();
        docId = ret.data![0].id;
      });

      for (const [key, value] of Object.entries(policies)) {
        if (value.policy === "allowed") {
          it(`other user can update ${key}`, async () => {
            const ret = await bob.supabase
              .from("documents")
              .update({ [key]: value.sampleValue }, { count: "exact" })
              .eq("id", docId)
              .select();

            expect(ret.count).toBe(1);
            expect(ret.error).toBeNull();
            expect((ret.data as any)![0][key]).toBe(
              value.checkValue || value.sampleValue
            );
          });
        } else if (
          value.policy === "forbidden" ||
          value.policy === "only-owner"
        ) {
          it(`other user can't update ${key}`, async () => {
            const ret = await bob.supabase
              .from("documents")
              .update({ [key]: value.sampleValue }, { count: "exact" })
              .eq("id", docId);

            if (value.policy === "only-owner") {
              expect(ret.count).toBe(0);
            } else {
              expect(ret.error?.message).toBe(
                "permission denied for table documents"
              );
            }
          });
        }
      }
    });
  });

  describe("read-only document", () => {
    const policies: PoliciesType = {
      id: {
        sampleValue: "4a9d2598-a52b-44a6-aad3-5917cd02b8e9",
        policy: "forbidden",
      },
      created_at: {
        sampleValue: "2021-01-01T00:00:00.000Z",
        policy: "forbidden",
      },
      user_id: {
        sampleValue: "4a9d2598-a52b-44a6-aad3-5917cd02b8e9",
        policy: "forbidden",
      },
      nano_id: {
        sampleValue: "hello",
        policy: "forbidden",
      },
      data: {
        sampleValue: "hello",
        policy: "only-owner",
        checkValue: "\\x" + Buffer.from("hello").toString("hex"),
      },
      public_access_level: {
        sampleValue: "write",
        policy: "only-owner",
      },
      updated_at: {
        sampleValue: "2021-01-01T00:00:00+00:00",
        policy: "only-owner",
      },
    };

    describe("owner", () => {
      let docId: string;

      beforeAll(async () => {
        const doc = createDocument(alice.user!.id, "hello", "read");
        const ret = await alice.supabase.from("documents").insert(doc).select();
        expect(ret.error).toBeNull();
        expect(ret.data![0].id).not.toBeNull();
        docId = ret.data![0].id;
      });

      for (const [key, value] of Object.entries(policies)) {
        if (value.policy === "allowed" || value.policy === "only-owner") {
          it(`owner can update ${key}`, async () => {
            const ret = await alice.supabase
              .from("documents")
              .update({ [key]: value.sampleValue }, { count: "exact" })
              .eq("id", docId)
              .select();

            expect(ret.error).toBeNull();
            expect(ret.count).toBe(1);
            expect((ret.data as any)![0][key]).toBe(
              value.checkValue || value.sampleValue
            );
          });
        } else if (value.policy === "forbidden") {
          it(`owner can't update ${key}`, async () => {
            const ret = await alice.supabase
              .from("documents")
              .update({ [key]: value.sampleValue }, { count: "exact" })
              .eq("id", docId)
              .select();
            expect(ret.count).toBeNull();
            expect(ret.error).not.toBeNull();
            expect(ret.error?.message).toBe(
              "permission denied for table documents"
            );
            expect(ret.data).toBeNull();
          });
        }
      }
    });

    describe("other user", () => {
      let docId: string;

      beforeAll(async () => {
        const doc = createDocument(alice.user!.id, "hello", "read");
        const ret = await alice.supabase.from("documents").insert(doc).select();
        expect(ret.error).toBeNull();
        expect(ret.data![0].id).not.toBeNull();
        docId = ret.data![0].id;
      });

      for (const [key, value] of Object.entries(policies)) {
        if (value.policy === "allowed") {
          it(`other user can update ${key}`, async () => {
            const ret = await bob.supabase
              .from("documents")
              .update({ [key]: value.sampleValue }, { count: "exact" })
              .eq("id", docId)
              .select();

            expect(ret.count).toBe(1);
            expect(ret.error).toBeNull();
            expect((ret.data as any)![0][key]).toBe(
              value.checkValue || value.sampleValue
            );
          });
        } else if (
          value.policy === "forbidden" ||
          value.policy === "only-owner"
        ) {
          it(`other user can't update ${key}`, async () => {
            const ret = await bob.supabase
              .from("documents")
              .update({ [key]: value.sampleValue }, { count: "exact" })
              .eq("id", docId)
              .select();

            if (value.policy === "only-owner") {
              expect(ret.count).toBe(0);
            } else {
              expect(ret.error?.message).toBe(
                "permission denied for table documents"
              );
            }
          });
        }
      }
    });
  });
});
