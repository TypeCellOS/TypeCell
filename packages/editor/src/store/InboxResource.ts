import * as Y from "yjs";
import { Identifier } from "../identifiers/Identifier";
import {
  BaseResource,
  BaseResourceExternalManager,
  UnimplementedBaseResourceExternalManager,
} from "./BaseResource";
import { ReferenceDefinition } from "./Ref";

export type RefInboxMessage<T extends ReferenceDefinition> = {
  message_type: "ref";
  id: string;
  namespace: T["namespace"];
  type: T["type"];
  source: string;
  clock: string;
};

// TODO: make sure inbox is an append-only array
export class InboxResource extends BaseResource {
  /** @internal */
  constructor(
    ydoc: Y.Doc,
    identifier: Identifier,
    manager: BaseResourceExternalManager = UnimplementedBaseResourceExternalManager
  ) {
    super(ydoc, identifier, manager);
    if (this.type !== "!inbox") {
      throw new Error("invalid type for InboxResource: " + this.type);
    }
  }

  public get inboxTarget() {
    const ret = this.ydoc.getMap("inboxmeta").get("target");
    if (typeof ret !== "string" || !ret) {
      throw new Error("invalid inbox target");
    }
    return ret;
  }

  public set inboxTarget(target: string) {
    if (this.ydoc.getMap("inboxmeta").get("target")) {
      // TODO: listen for this and prevent updates that do this
      throw new Error("cannot change inbox target");
    }
    this.ydoc.getMap("inboxmeta").set("target", target);
  }

  /** @internal */
  public get inbox(): Y.Array<RefInboxMessage<any>> {
    return this.ydoc.getArray("inbox");
  }

  public getRefMessages<T extends ReferenceDefinition>(referenceDefinition: T) {
    const messages: RefInboxMessage<T>[] = [];

    this.inbox.forEach((item: { [key: string]: unknown }) => {
      if (item.message_type !== "ref") {
        return;
      }

      if (item.namespace !== referenceDefinition.namespace) {
        return;
      }

      if (item.type !== referenceDefinition.type) {
        return;
      }

      if (typeof item.id !== "string" || !item.id) {
        return;
      }

      if (typeof item.source !== "string" || !item.source) {
        return;
      }

      if (typeof item.clock !== "string" || !item.clock) {
        return;
      }

      messages.push({
        message_type: item.message_type,
        id: item.id,
        namespace: item.namespace,
        type: item.type,
        source: item.source,
        clock: item.clock,
      });
    });
    return messages;
  }
}
