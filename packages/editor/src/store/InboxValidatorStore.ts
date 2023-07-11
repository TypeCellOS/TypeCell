import { ReferenceDefinition } from "@typecell-org/shared/src/Ref";
import { autorun } from "mobx";
import { lifecycle } from "vscode-lib";
import * as Y from "yjs";
import { UnreachableCaseError } from "../util/UnreachableCaseError";
import { BaseResource } from "./BaseResource";
import { InboxResource, RefInboxMessage } from "./InboxResource";

/*
 * References are bi-directional links between documents.
 * They are stored in one Resource (the source) and point to another Resource (the target).
 * Any document also has a public append-only inbox where other documents can send messages.
 * This inbox is used to store "back"-references. 
 * 
 * This system is used so that access control is governed by the source document, but anyone can post "backreferences" to a target document

 * This class is responsible for validating ref-messages (backreferences) in the public inbox of a resource.
 *
 * It validates messages by:
 * - checking if the message type / reference is valid
 * - loading the source document where the ref should be stored, and wait to make sure that it's up to date (has the document "update" indicated by the clock in the message)
 * - checking if the source document has the ref was indicated by the message
 * 
 * An invalid message can either be caused by:
 * - a malformated message
 * - an "illegal message": a message was posted to the inbox, but the original ref was not ("legally") created
 * - a subsumed message: the original ref doesn't exist anymore or has been replaced
 * */
export class InboxValidator<
  T extends ReferenceDefinition
> extends lifecycle.Disposable {
  // 3 message states: valid, invalid, pending
  // - a message cannot transition from invalid to any other state
  // - a message can transition from pending to valid or invalid
  // - a message can transition from valid to invalid, for example if a reference has been changed / removed

  private readonly invalidMessages = new Set<string>();
  private readonly validMessages = new Set<string>();
  private readonly pendingMessages = new Set<string>();

  // TODO: store this somewhere locally
  private readonly seenMessages = new Set<string>();

  private readonly documentDisposers = new Map<string, () => void>();

  /** @internal */
  constructor(
    private readonly inbox: InboxResource,
    private referenceDefinition: T,
    loader: (idString: string) => Promise<BaseResource>
  ) {
    super();
    const dispose = autorun(() => {
      this.allRefMessages.forEach(async (message) => {
        // console.log("message", message);
        if (this.seenMessages.has(message.id)) {
          return;
        }
        this.seenMessages.add(message.id);
        this.pendingMessages.add(message.id);

        const resource = await loader(message.source);
        const handler = () => {
          this.updateMessageStateFromResource(message, resource);
        };
        resource.ydoc.on("update", handler);
        handler(); // initial check
        this.documentDisposers.set(message.id, () => {
          resource.ydoc.off("update", handler);
          resource.dispose();
        });
      });
    });

    this._register({
      dispose,
    });

    this._register({
      dispose: () => {
        this.documentDisposers.forEach((dispose) => dispose());
      },
    });
  }

  private updateMessageStateFromResource(
    message: RefInboxMessage<T>,
    resource: BaseResource
  ) {
    if (this.invalidMessages.has(message.id)) {
      throw new Error("invalid should not be checked anymore");
    }

    const result = this.ValidateRefMessage(message, resource);
    if (result === true) {
      // transition from pending to valid
      // or keep from valid to valid (in case it was already validated the lines below are no-ops)
      this.validMessages.add(message.id);
      this.pendingMessages.delete(message.id);
    } else if (result === "wait") {
      // do nothing
    } else if (result === false) {
      // transition from pending or valid to invalid
      this.invalidMessages.add(message.id);
      this.pendingMessages.delete(message.id);
      this.validMessages.delete(message.id);
      this.documentDisposers.get(message.id)?.();
      this.documentDisposers.delete(message.id);
    } else {
      throw new UnreachableCaseError(result);
    }
  }

  private ValidateRefMessage(
    message: RefInboxMessage<T>,
    resource: BaseResource
  ) {
    if (message.message_type !== "ref") {
      throw new Error("invalid inbox message (ref)");
    }
    const [client, clock] = message.clock.split(":");
    let clockNum = parseInt(clock);
    let clientNum = parseInt(client);
    if (isNaN(clockNum) || isNaN(clientNum)) {
      throw new Error("invalid inbox message (clock / client)");
    }

    const state = Y.getState(resource.ydoc.store, clientNum);
    if (state < clockNum) {
      // we need to wait for the document to be updated
      console.log("wait");
      return "wait";
    }

    const ref = resource.getRef(
      this.referenceDefinition,
      this.inbox.inboxTarget
    );
    if (!ref || ref.target !== this.inbox.inboxTarget) {
      // console.log("invalid", ref?.target, this.inbox.inboxTarget);
      return false;
    }
    // console.log("valid", ref.target, this.inbox.inboxTarget);
    return true;
  }

  /**
   * This is the list of all ref messages of type referenceDefinition that are currently in the inbox.
   */
  private get allRefMessages() {
    // console.log("serialize", this.inbox.ydoc.toJSON());
    return this.inbox.getRefMessages(this.referenceDefinition);
  }

  /**
   * This is the list of all ref messages of type referenceDefinition that are in the inbox and are valid
   */
  public get validRefMessages() {
    return this.allRefMessages.filter((item) =>
      this.validMessages.has(item.id)
    );
  }
}
