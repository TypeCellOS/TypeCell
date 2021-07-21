// TODO (security): user2 can create a room @user1/doc
export async function createMatrixDocument(
  matrixClient: any,
  parentId: string,
  roomName: string
) {
  try {
    const ret = await matrixClient.createRoom({
      room_alias_name: roomName,
      visibility: "private",
      name: roomName,
      topic: "",
    });

    // The history of a (publicly accessible) room should be readable by everyone,
    // so that all users can get all yjs updates
    await matrixClient.sendStateEvent(
      ret.room_id,
      "m.room.history_visibility",
      {
        history_visibility: "world_readable",
      },
      ""
    );

    // invite-only
    await matrixClient.sendStateEvent(
      ret.room_id,
      "m.room.join_rules",
      { join_rule: "invite" }, // or "public"
      ""
    );

    // guests should not be able to actually join the room,
    // because we don't want guests to be able to write
    await matrixClient.sendStateEvent(
      ret.room_id,
      "m.room.guest_access",
      { guest_access: "forbidden" },
      ""
    );

    // TODO: add room to space

    return { status: "ok" as "ok", roomId: ret.room_id };
  } catch (e) {
    if (e.errcode === "M_ROOM_IN_USE") {
      return "already-exists" as "already-exists";
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

// export async function createDocument(title: string) {
//   const matrixClient = MatrixClientPeg.get();
//   const currentUserId = matrixClient.getUserId() as string;
//   // const currentUser = matrixClient.getUser(currentUserId);

//   const parts = currentUserId.split(":");
//   if (parts.length !== 2) {
//     throw new Error("unexpected");
//   }
//   const [user, host] = parts; // TODO: think out host for federation

//   // TODO: get ownerSlug from userprofile
//   const ownerSlug = slug(user);

//   const titleSlug = slug(title);

//   if (
//     !user.startsWith("@") ||
//     !ownerSlug.length ||
//     titleSlug.includes("/") ||
//     ownerSlug.includes("/")
//   ) {
//     throw new Error("unexpected");
//   }

//   const titleSlug = slug(title);
//   if (!titleSlug.length) {
//     return "invalid-title" as "invalid-title";
//   }

//   const id = ownerSlug + "/" + titleSlug;

//   const matrixResult = await createMatrixDocument(ownerSlug, id);

//   if (matrixResult === "offline" || matrixResult === "ok") {
//     const doc = DocConnection.load(id);
//     return "ok" as "ok";
//   }

//   return matrixResult;
// }
