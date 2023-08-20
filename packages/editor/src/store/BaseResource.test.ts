/**
 * @vitest-environment jsdom
 */

import { enableMobxBindings } from "@syncedstore/yjs-reactive-bindings";
import { ChildReference } from "@typecell-org/shared";
import * as mobx from "mobx";
import { beforeEach, describe, expect, it } from "vitest";
import { async, uri } from "vscode-lib";
import * as Y from "yjs";
import { Identifier } from "../identifiers/Identifier";
import {
  BaseResource,
  UnimplementedBaseResourceExternalManager,
} from "./BaseResource";
import { InboxResource } from "./InboxResource";
import { InboxValidator } from "./InboxValidatorStore";

enableMobxBindings(mobx);
type Username = string;
type DocId = string;

type User = {
  name: Username;
  docs: Record<
    DocId,
    {
      ydoc: Y.Doc;
      resource: BaseResource;
      resourceAsInbox: InboxResource | undefined;
      validator: InboxValidator<typeof ChildReference> | undefined;
    }
  >;
  allowedToWriteDocs: Set<DocId>;
};

class TestIdentifier extends Identifier {
  constructor(public readonly id: string) {
    super(["test"], uri.URI.parse("test://test/" + id));
  }
}

function syncDocFromUserToUser(fromUser: User, toUser: User, docId: DocId) {
  if (!fromUser.allowedToWriteDocs.has(docId)) {
    console.warn("skip syncing doc because user is not allowed to write");
    return;
  }
  const doc1 = fromUser.docs[docId];
  const doc2 = toUser.docs[docId];
  const syncDoc1 = Y.encodeStateAsUpdate(doc1.ydoc);
  Y.applyUpdate(doc2.ydoc, syncDoc1);
}

function syncAllDocsFromUserToUser(
  fromUser: User,
  toUser: User,
  exclude?: DocId[]
) {
  for (const docId of Object.keys(fromUser.docs)) {
    if (exclude && exclude.includes(docId)) {
      continue;
    }
    syncDocFromUserToUser(fromUser, toUser, docId);
  }
}

function createDocAndAllowAccess(forUsers: User[], docId: DocId) {
  for (const user of forUsers) {
    // create inbox
    const inboxDoc = new Y.Doc();
    user.allowedToWriteDocs.add(docId + "-inbox");
    const inboxBaseResource = new BaseResource(
      inboxDoc,
      new TestIdentifier(docId + "-inbox")
    );
    inboxBaseResource.create("!inbox");
    const resourceAsInbox = inboxBaseResource.getSpecificType<InboxResource>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      InboxResource as any
    );
    resourceAsInbox.inboxTarget = "test:test/" + docId;
    user.docs[docId + "-inbox"] = {
      resourceAsInbox,
      resource: inboxBaseResource,
      ydoc: inboxDoc,
      validator: undefined,
    };

    // create main doc
    const ydoc = new Y.Doc();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manager: any = {
      loadInboxResource: async (id: TestIdentifier) => {
        // const testIdentifier = new TestIdentifier(id.toString());
        const inbox = user.docs[id.id + "-inbox"].resourceAsInbox;
        if (!inbox) {
          throw new Error("can't resolve inbox id " + id);
        }
        return inbox;
      },
    };
    manager.prototype = UnimplementedBaseResourceExternalManager;
    const resource = new BaseResource(ydoc, new TestIdentifier(docId), manager);

    const validator = new InboxValidator(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      resourceAsInbox!,
      ChildReference,
      async (idStr) => {
        // hacky
        const testIdentifier = uri.URI.parse(idStr.replace("test:", "test://"));
        const docId = testIdentifier.path.substring(1);
        return user.docs[docId].resource;
      }
    );

    user.docs[docId] = {
      resourceAsInbox: undefined,
      resource,
      ydoc,
      validator,
    };
    user.allowedToWriteDocs.add(docId);
  }
}

describe("links", () => {
  let user1: User;
  let user2: User;

  beforeEach(() => {
    user1 = {
      name: "user1",
      docs: {},
      allowedToWriteDocs: new Set(),
    };
    user2 = {
      name: "user2",
      docs: {},
      allowedToWriteDocs: new Set(),
    };
  });

  it("syncs info two-way", () => {
    createDocAndAllowAccess([user1, user2], "doc1");

    user1.docs.doc1.ydoc.getMap("test").set("hello", "world");
    expect(user2.docs.doc1.ydoc.getMap("test").get("hello")).toBeUndefined();
    syncAllDocsFromUserToUser(user1, user2);
    expect(user2.docs.doc1.ydoc.getMap("test").get("hello")).toBe("world");

    user2.docs.doc1.ydoc.getMap("test").set("hello", "world2");
    expect(user1.docs.doc1.ydoc.getMap("test").get("hello")).toBe("world");
    syncAllDocsFromUserToUser(user2, user1);
    expect(user1.docs.doc1.ydoc.getMap("test").get("hello")).toBe("world2");
  });

  it("does not sync if user is not allowed to write", () => {
    createDocAndAllowAccess([user1, user2], "doc1");
    user1.allowedToWriteDocs.delete("doc1");

    user1.docs.doc1.ydoc.getMap("test").set("hello", "world");
    expect(user2.docs.doc1.ydoc.getMap("test").get("hello")).toBeUndefined();
    syncAllDocsFromUserToUser(user1, user2);
    expect(user2.docs.doc1.ydoc.getMap("test").get("hello")).toBeUndefined();
  });

  it("adds a ref", async () => {
    createDocAndAllowAccess([user1, user2], "doc1");
    createDocAndAllowAccess([user1, user2], "doc2");

    await user1.docs.doc1.resource.addRef(
      ChildReference,
      new TestIdentifier("doc2")
    );

    expect(user1.docs.doc1.resource.getRefs(ChildReference).length).toBe(1);
    expect(user2.docs.doc1.resource.getRefs(ChildReference).length).toBe(0);
    syncAllDocsFromUserToUser(user1, user2, ["doc2-inbox"]);
    expect(user2.docs.doc1.resource.getRefs(ChildReference).length).toBe(1);

    await new Promise((resolve) => setImmediate(resolve)); // allow autorun to fire

    await async.timeout(100);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(user1.docs.doc2.validator!.validRefMessages.length).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(user2.docs.doc2.validator!.validRefMessages.length).toBe(0);

    syncAllDocsFromUserToUser(user2, user1);

    await new Promise((resolve) => setImmediate(resolve)); // allow autorun to fire

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(user2.docs.doc2.validator!.validRefMessages.length).toBe(0);
  });
});
