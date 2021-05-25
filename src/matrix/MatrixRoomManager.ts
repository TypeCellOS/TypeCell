import { MatrixClientPeg } from "./MatrixClientPeg";

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
