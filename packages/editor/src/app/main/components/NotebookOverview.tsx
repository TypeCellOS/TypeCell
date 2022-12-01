import Textfield from "@atlaskit/textfield";
import { Method } from "matrix-js-sdk";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { parseIdentifier } from "../../../identifiers";
import { getStoreService } from "../../../store/local/stores";
import { toIdentifier } from "../../routes/routes";
import styles from "./NotebookOverview.module.css";

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
  return (
    <div className={styles.room}>
      <Link
        to={toIdentifier(
          parseIdentifier({ owner: props.room.user, document: props.room.name })
        )}
        className={styles.roomName}>
        {props.room.name}
      </Link>
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

        if (typeof sessionStore.user === "string") {
          sessionStore.enableGuest();
          return;
        }
        // A user's own rooms
        // const result = await matrixClient.getJoinedRooms();

        // const promises = result.joined_rooms.map(async (roomId: string) => await resolveRoom(roomId));

        // Resolve room aliases and filter undefined values
        // const resolvedRooms = await (await Promise.all<Room | undefined>(promises)).filter(r => r).map(r => r as Room);

        // Currently we limit search to Public rooms by this user
        const matrixClient = sessionStore.user.matrixClient;

        const result = await matrixClient.http.authedRequest<any>(
          undefined as any,
          Method.Post,
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
  }, [sessionStore, sessionStore.user, props.owner]);

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

  if (
    sessionStore.user === "loading" ||
    sessionStore.user === "offlineNoUser"
  ) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* <div className="header">{props.owner}'s notebooks</div> */}
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
