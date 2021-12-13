import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { getStoreService } from "../../../store/local/stores";
import Textfield from '@atlaskit/textfield';
import styles from "./NotebookOverview.module.css";

type Room = {
    name: string;
    user: string;
    server: string;
}

const RoomInfo = function (props: { room: Room }) {
    return <div className={styles.room}>
        <a href={`/${props.room.user}/${props.room.name}`} className={styles.roomName}>{props.room.name}</a>
        <div className={styles.user}>{props.room.user}</div>
        {/* <div className={styles.roomName}>{props.server}</div> */}
    </div>
}

type NotebookOverviewProps = {
    owner: string
}

export const NotebookOverview = observer(function (props: NotebookOverviewProps) {
    const sessionStore = getStoreService().sessionStore;

    if (sessionStore.user === "loading" || sessionStore.user === "offlineNoUser") {
        return <div>Not logged in</div>;
    }


    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([])
    const [notebookListLimit, setNotebookListLimit] = useState(window.innerWidth < 731 ? 20 : 40);

    const [searchString, setSearchString] = useState("");

    // const user = sessionStore.user;
    const matrixClient = sessionStore.user.matrixClient;

    useEffect(() => {
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
                server
            };
        }

        async function resolveRoom(roomId: string): Promise<Room | undefined> {
            const result = await matrixClient.http.authedRequest(
                undefined,
                "GET",
                `/rooms/${roomId}/aliases`,
            )

            const rawAlias = result.aliases[0] as string;

            return parseRoomFromAlias(rawAlias);
        }

        async function fetchNotebooks() {
            try {
                setLoading(true);

                // A user's own rooms
                // const result = await matrixClient.getJoinedRooms();

                // const promises = result.joined_rooms.map(async (roomId: string) => await resolveRoom(roomId));

                // Resolve room aliases and filter undefined values
                // const resolvedRooms = await (await Promise.all<Room | undefined>(promises)).filter(r => r).map(r => r as Room);

                // Public rooms
                const result = await matrixClient.http.authedRequest(
                    undefined,
                    "GET",
                    `/publicRooms`,
                )

                console.log(result);

                const resolvedRooms: Room[] = result.chunk
                    .map((res: any) => parseRoomFromAlias(res.canonical_alias))
                    .filter((r: Room | undefined) => r && r.user === props.owner)

                // Sort rooms own-room first
                // if (user.type === "matrix-user") {
                //     resolvedRooms.sort((a, b) => {
                //         let c = a.user === user.userId ? -1 : 1;

                //         c += b.user === user.userId ? 1 : -1;

                //         return c;
                //     })
                // }

                setRooms(resolvedRooms);

                setLoading(false);
            } catch (error) {
                setLoading(true);
            }
        }

        fetchNotebooks()
    }, [matrixClient, props.owner]);

    useEffect(() => {
        window.onresize = function () {
            setNotebookListLimit(window.innerWidth < 731 ? 20 : 40);
        }
    }, [])

    const notebookList = rooms ? <>
        {rooms
            .filter((r) => r.name.includes(searchString))
            .slice(0, notebookListLimit)
            .map((room) => <RoomInfo key={`${room.user}/${room.name}`} room={room} />)
        }
    </> : []

    return <div>
        {/* <div className="header">{props.owner}'s notebooks</div> */}
        <Textfield name="basic" aria-label="default text field" placeholder="Type to filter notebooks..." onChange={function (event) {
            setSearchString((event.target as HTMLInputElement).value);
        }} />
        <div className={styles.notebookList}>
            {loading ? "Fetching notebooks..." : notebookList}
        </div>
    </div>
});