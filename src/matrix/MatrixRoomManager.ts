import { MatrixClient } from "matrix-js-sdk";
import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as _ from "lodash";
import { encodeBase64, decodeBase64 } from "./unexported/olmlib";
import { MatrixClientPeg } from "./MatrixClientPeg";
import { slug } from "../util/slug";

export async function createMatrixDocument(parentId: string, id: string) {
  const matrixClient = MatrixClientPeg.get();
  try {
    const ret = await matrixClient.createRoom({
      room_alias_name: id,
      visibility: "private",
      name: id,
      topic: "",
    });

    // TODO: add room to space

    return "ok" as "ok";
    // this.roomId = ret.room_id;
  } catch (e) {
    if (e.errcode === "M_ROOM_IN_USE") {
      return "in-use" as "in-use";
    }
    if (e.name === "ConnectionError") {
      return "offline";
    }

    return {
      status: "error" as "error",
      error: e,
    };
    // offline error?
  }
}

export async function createDocument(title: string) {
  const matrixClient = MatrixClientPeg.get();
  const currentUserId = matrixClient.getUserId() as string;
  // const currentUser = matrixClient.getUser(currentUserId);

  const parts = currentUserId.split(":");
  if (parts.length !== 2) {
    throw new Error("unexpected");
  }
  const [user, host] = parts; // TODO: think out host for federation

  // TODO: get ownerSlug from userprofile
  const ownerSlug = slug(user);

  const titleSlug = slug(title);

  if (
    !user.startsWith("@") ||
    !ownerSlug.length ||
    titleSlug.includes("/") ||
    ownerSlug.includes("/")
  ) {
    throw new Error("unexpected");
  }

  if (!titleSlug.length) {
    return "invalid-title" as "invalid-title";
  }

  const id = ownerSlug + "/" + titleSlug;

  const matrixResult = await createMatrixDocument(ownerSlug, id);
  if (matrixResult === "offline") {
    return "ok" as "ok";
  }
  return matrixResult;
}
