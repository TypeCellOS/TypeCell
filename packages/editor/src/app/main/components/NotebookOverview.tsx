import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { getStoreService } from "../../../store/local/stores";
import Textfield from "@atlaskit/textfield";
import styles from "./NotebookOverview.module.css";
import { parseIdentifier } from "../../../identifiers";

type Room = {
  name: string;
  user: string;
  fullName: string;
  server: string;
};

function parseRoomFromAlias(rawAlias: string): Room | undefined {
  var regex = new RegExp("#(.*)/(.*):(.*)", "g");
  const match = regex.exec(rawAlias);

  if (!match) {
    return undefined;
  }

  const user = match[1];
  const name = match[2];
  const server = match[3];

  return {
    name,
    user,
    server,
    fullName: `${user}/${name}`,
  };
}

const RoomInfo = function (props: { room: Room }) {
  function navigate(e: React.MouseEvent) {
    e.preventDefault();
    getStoreService().navigationStore.navigateToIdentifier(
      parseIdentifier(props.room.fullName)
    );
  }
  return (
    <div className={styles.room}>
      <a
        href={`/${props.room.user}/${props.room.name}`}
        className={styles.roomName}
        onClick={navigate}>
        {props.room.name}
      </a>
      <div className={styles.user}>{props.room.user}</div>
      {/* <div className={styles.roomName}>{props.server}</div> */}
    </div>
  );
};

type NotebookOverviewProps = {
  owner: string;
};

/**
 * Notebook Overview
 *
 * Currently, we directly fetch notebooks from Matrix.
 * What would a local-first version of this look like? Perhaps we have to create Yjs document that's
 * an index of all the notebooks per user
 */
export const NotebookOverview = observer(function (
  props: NotebookOverviewProps
) {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [searchString, setSearchString] = useState("");

  const sessionStore = getStoreService().sessionStore;

  if (
    sessionStore.user === "loading" ||
    sessionStore.user === "offlineNoUser"
  ) {
    return <div>Not logged in</div>;
  }

  // const user = sessionStore.user;
  const matrixClient = sessionStore.user.matrixClient;

  useEffect(() => {
    // async function resolveRoom(roomId: string): Promise<Room | undefined> {
    //     const result = await matrixClient.http.authedRequest(
    //         undefined,
    //         "GET",
    //         `/rooms/${roomId}/aliases`,
    //     )

    //     const rawAlias = result.aliases[0] as string;

    //     return parseRoomFromAlias(rawAlias);
    // }

    async function fetchNotebooks() {
      try {
        setLoading(true);

        // A user's own rooms
        // const result = await matrixClient.getJoinedRooms();

        // const promises = result.joined_rooms.map(async (roomId: string) => await resolveRoom(roomId));

        // Resolve room aliases and filter undefined values
        // const resolvedRooms = await (await Promise.all<Room | undefined>(promises)).filter(r => r).map(r => r as Room);

        // Currently we limit search to Public rooms by this user
        const result = await matrixClient.http.authedRequest(
          undefined,
          "POST",
          `/publicRooms`,
          undefined,
          {
            filter: {
              generic_search_term: props.owner + "/",
            },
          }
        );

        // console.log(result);

        const resolvedRooms: Room[] = (result.chunk as any[])
          .map((res: any) => parseRoomFromAlias(res.canonical_alias))
          .filter(
            (r: Room | undefined): r is Room => !!r && r.user === props.owner
          )
          .sort((a, b) => a.fullName.localeCompare(b.fullName));

        setRooms(resolvedRooms);

        setLoading(false);
      } catch (error) {
        setLoading(true);
      }
    }

    fetchNotebooks();
  }, [matrixClient, props.owner]);

  const notebookList = rooms ? (
    <>
      {rooms
        .filter((r) => r.name.includes(searchString))
        .map((room) => (
          <RoomInfo key={room.fullName} room={room} />
        ))}
    </>
  ) : (
    []
  );

  return (
    <div className={styles.notebookOverview}>
      {/* <div clashsName="header">{props.owner}'s notebooks</div> */}
      <h5>Public Documents</h5>
      <Textfield
        placeholder="Type to filter notebooks..."
        onChange={function (event) {
          setSearchString((event.target as HTMLInputElement).value);
        }}
      />
      <div className={styles.notebookList}>
        {loading ? "Fetching notebooks..." : notebookList}
      </div>
    </div>
  );
});
