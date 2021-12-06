import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { getStoreService } from "../../../store/local/stores";
import styles from "./NotebookOverview.module.css";

type Room = {
    alias: string;
    user: string;
    server: string;
}

const RoomInfo = function (props: { room: Room }) {
    return <a href={`/${props.room.user}/${props.room.alias}`}>
        <div className={styles.room}>
            <div className={styles.roomName}>{props.room.alias}</div>
            <div className={styles.user}>{props.room.user}</div>
            {/* <div className={styles.roomName}>{props.server}</div> */}
        </div>
    </a>
}

export const NotebookOverview = observer(function () {
    const sessionStore = getStoreService().sessionStore;

    if (sessionStore.user === "loading" || sessionStore.user === "offlineNoUser") {
        return <div>Not logged in</div>;
    }

    const user = sessionStore.user;

    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([])

    const matrixClient = sessionStore.user.matrixClient;

    useEffect(() => {
        async function resolveRoom(roomId: string): Promise<Room | undefined> {
            const result = await matrixClient.http.authedRequest(
                undefined,
                "GET",
                `/rooms/${roomId}/aliases`,
            )

            const rawAlias = result.aliases[0] as string;

            var regex = new RegExp("#(.*)/(.*):(.*)", "g");
            const match = regex.exec(rawAlias);

            if (!match) {
                return undefined;
            }

            const user = match[1];
            const alias = match[2];
            const server = match[3];

            return {
                alias,
                user,
                server
            };
        }

        async function fetchNotebooks() {
            try {
                setLoading(true);

                const result = await matrixClient.getJoinedRooms()

                const promises = result.joined_rooms.map(async (roomId: string) => await resolveRoom(roomId));

                // Resolve room aliases and filter undefined values
                const resolvedRooms = await (await Promise.all<Room | undefined>(promises)).filter(r => r).map(r => r as Room);

                // Sort rooms own-room first
                if (user.type === "matrix-user") {
                    resolvedRooms.sort((a, b) => {
                        let c = a.user === user.userId ? -1 : 1;

                        c += b.user === user.userId ? 1 : -1;

                        return c;
                    })
                }

                setRooms(resolvedRooms);

                setLoading(false);
            } catch (error) {
                setLoading(true);
            }
        }

        fetchNotebooks()
    }, [matrixClient, user]);

    const notebookList = rooms ? <div>
        {rooms.map((room) => <RoomInfo key={`${room.user}/${room.alias}`} room={room} />)}
    </div> : []

    return <div className={styles.wrapper}>
        <h1 className={styles.title}>Notebooks</h1>
        <div className={styles.notebookList}>
            {loading ? "Fetching notebooks..." : notebookList}
        </div>
    </div>
});