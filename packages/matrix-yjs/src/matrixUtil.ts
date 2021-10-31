import { base64 } from "@typecell-org/common";
import { MatrixClient } from "matrix-js-sdk";

export const MESSAGE_EVENT_TYPE = "m.room.message";
export const UPDATE_EVENT_TYPE = "org.typecell.doc_update";
export const SNAPSHOT_EVENT_TYPE = "org.typecell.doc_snapshot";

// set to true to send everything as m.room.message, so you can debug rooms easily in element
// or other matrix clients
const updates_as_messages = false;

export const WRAPPED_EVENT_TYPE = updates_as_messages
  ? MESSAGE_EVENT_TYPE
  : UPDATE_EVENT_TYPE;

export async function sendMessage(
  client: MatrixClient,
  roomId: string,
  message: string,
  eventType = MESSAGE_EVENT_TYPE
) {
  const content = {
    body: message,
    msgtype: "m.text",
  };
  client.scheduler = undefined;
  await client.sendEvent(roomId, eventType, content, "");
}

export async function sendUpdate(
  client: MatrixClient,
  roomId: string,
  update: Uint8Array
) {
  const encoded = base64.encodeBase64(update);
  const content = {
    update: encoded,
  };
  if (updates_as_messages) {
    const wrappedContent = {
      body: UPDATE_EVENT_TYPE + ": " + encoded,
      msgtype: UPDATE_EVENT_TYPE,
      ...content,
    };
    client.scheduler = undefined;
    await client.sendEvent(roomId, MESSAGE_EVENT_TYPE, wrappedContent, "");
  } else {
    await client.sendEvent(roomId, UPDATE_EVENT_TYPE, content, "");
  }
}

export async function sendSnapshot(
  client: MatrixClient,
  roomId: string,
  snapshot: Uint8Array,
  lastEventId: string
) {
  const encoded = base64.encodeBase64(snapshot);
  const content = {
    update: encoded,
    last_event_id: lastEventId,
  };
  if (updates_as_messages) {
    const wrappedContent = {
      body: SNAPSHOT_EVENT_TYPE + ": " + encoded,
      msgtype: SNAPSHOT_EVENT_TYPE,
      ...content,
    };
    client.scheduler = undefined;
    await client.sendEvent(roomId, MESSAGE_EVENT_TYPE, wrappedContent, "");
  } else {
    await client.sendEvent(roomId, SNAPSHOT_EVENT_TYPE, content, "");
  }
}

export function isUpdateEvent(event: any) {
  if (updates_as_messages) {
    return (
      event.type === MESSAGE_EVENT_TYPE &&
      event.content.msgtype === UPDATE_EVENT_TYPE
    );
  }
  return event.type === UPDATE_EVENT_TYPE;
}

export function isSnapshotEvent(event: any) {
  if (updates_as_messages) {
    return (
      event.type === MESSAGE_EVENT_TYPE &&
      event.content.msgtype === SNAPSHOT_EVENT_TYPE
    );
  }
  return event.type === SNAPSHOT_EVENT_TYPE;
}
