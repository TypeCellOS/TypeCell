import { MatrixClient } from "matrix-js-sdk";

export async function sendMessage(
  client: MatrixClient,
  roomId: string,
  content: string | { body: string; msgtype: string },
  eventType = "m.room.message"
) {
  if (typeof content === "string") {
    content = {
      body: content,
      msgtype: "m.text",
    };
  }

  await client.sendEvent(roomId, eventType, content, "");
}
