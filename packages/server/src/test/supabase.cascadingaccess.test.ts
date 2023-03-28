import { beforeAll, describe, expect, it } from "vitest";
import { generateId } from "../util/uniqueId";
import { generateUuid } from "../util/uuid";
import { createRandomUser } from "./supabaseTestUtil";

function createDocument(userId: string, data: string, publicDocument = false) {
  const date = JSON.stringify(new Date());
  return {
    id: generateUuid(),
    created_at: date,
    updated_at: date,
    data: JSON.stringify(data),
    nano_id: generateId(),
    public_access_level: "no-access",
    user_id: userId,
  } as const;
}

/*

I want to enforce the following rules in postgres:

- a user's read / write access can be set on any document
- a document can be a child of one or more other documents
- a document can be a parent of one or more other documents
- if a user has specific access to a document, then that is the access they have
- if a user does not have specific access to a document, then they have access based on the access of their parent documents. This works recursively up the tree. If at some point a document has multiple parents, then the user's access is the most restrictive of the parent documents.
*/

describe("supabase update tests", () => {
  let alice: Awaited<ReturnType<typeof createRandomUser>>;
  let bob: Awaited<ReturnType<typeof createRandomUser>>;

  beforeAll(async () => {
    alice = await createRandomUser("alice");
    bob = await createRandomUser("bob");
  });

  /*
Example:

- Document A is a child of Document B
- Document B is a child of Document C
- Document A is also a child of Document D
- User Alice has read/write access to Document C, and Document D
- User Alice explicitly has no access to document B
- In this case, Alice does not have access to document A, because even though it has access to document D it doesn't have access to document B. It doesn't have access to document B, because this has been explicitly denied, even though Alice has access to B's parent C

*/
  it("test first scenario", async () => {
    const docA = createDocument(alice.user!.id, "helloA", true);
    const docB = createDocument(alice.user!.id, "helloB", true);
    const docC = createDocument(alice.user!.id, "helloC", true);
    const docD = createDocument(alice.user!.id, "helloD", true);
    const ret = await alice.supabase
      .from("documents")
      .insert([docA, docB, docC, docD])
      .select();
    console.log(ret.error);
    expect(ret.error).toBeNull();

    const retRels = await alice.supabase.from("document_relations").insert([
      { child_id: docA.id, parent_id: docB.id },
      { child_id: docB.id, parent_id: docC.id },
      { child_id: docA.id, parent_id: docD.id },
    ]);
    expect(retRels.error).toBeNull();

    const retPerms = await alice.supabase.from("document_permissions").insert([
      {
        document_id: docC.id,
        user_id: bob.user!.id,
        access_level: "read",
      },
      {
        document_id: docD.id,
        user_id: bob.user!.id,
        access_level: "read",
      },
      {
        document_id: docB.id,
        user_id: bob.user!.id,
        access_level: "no-access",
      },
    ]);

    expect(retPerms.error).toBeNull();

    const ret2 = await bob.supabase
      .from("documents")
      .select()
      .eq("id", docA.id);

    expect(ret2.error).toBeNull();
    expect(ret2.data!.length).toBe(0);
  });

  /*
  Another example:

- Document A is a child of Document B
- Document B is a child of Document C
- Document A is also a child of Document D
- User Alice has read/write access to Document B, and Document D
- User Alice explicitly has no access to document C
- In this case, Alice does have access to document A, because it has access to document D and to document B. It has access to document B because it's been granted explicitly, even though she does not have access to it's parent C
*/
  it("test second scenario", async () => {
    const docA = createDocument(alice.user!.id, "helloA", true);
    const docB = createDocument(alice.user!.id, "helloB", true);
    const docC = createDocument(alice.user!.id, "helloC", true);
    const docD = createDocument(alice.user!.id, "helloD", true);
    const ret = await alice.supabase
      .from("documents")
      .insert([docA, docB, docC, docD])
      .select();
    console.log(ret.error);
    expect(ret.error).toBeNull();

    const retRels = await alice.supabase.from("document_relations").insert([
      { child_id: docA.id, parent_id: docB.id },
      { child_id: docB.id, parent_id: docC.id },
      { child_id: docA.id, parent_id: docD.id },
    ]);
    expect(retRels.error).toBeNull();

    const retPerms = await alice.supabase.from("document_permissions").insert([
      {
        document_id: docC.id,
        user_id: bob.user!.id,
        access_level: "no-access",
      },
      {
        document_id: docD.id,
        user_id: bob.user!.id,
        access_level: "read",
      },
      {
        document_id: docB.id,
        user_id: bob.user!.id,
        access_level: "read",
      },
    ]);

    expect(retPerms.error).toBeNull();

    const ret2 = await bob.supabase
      .from("documents")
      .select()
      .eq("id", docA.id);

    expect(ret2.error).toBeNull();
    expect(ret2.data!.length).toBe(1);
  });
});
