import Button from "@atlaskit/button";
import { useResource } from "@typecell-org/util";
import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
import Avatar from "react-avatar";
import { useNavigate } from "react-router-dom";
import { Identifier } from "../../../identifiers/Identifier";
import { identifiersToPath } from "../../../identifiers/paths/identifierPathHelpers";
import { DocConnection } from "../../../store/DocConnection";
import ProfileResource from "../../../store/ProfileResource";
import { SessionStore } from "../../../store/local/SessionStore";
import styles from "./ProfileRenderer.module.css";

type Props = {
  profile: ProfileResource;
  subIdentifiers: Identifier[];
  sessionStore: SessionStore;
};

const ProfileRenderer: React.FC<Props> = observer((props) => {
  const navigate = useNavigate();

  const joinedDate = useMemo(() => {
    if (!props.profile.joinedDate) {
      return undefined;
    }
    const options = { year: "numeric", month: "long", day: "numeric" } as const;
    const date = new Intl.DateTimeFormat("en-US", options).format(
      props.profile.joinedDate
    );
    return date;
  }, [props.profile.joinedDate]);

  // const wsPath =
  //   "/" +
  //   identifiersToPath(
  //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  //     parseIdentifier(props.profile.workspaces.get("public")!)
  //   );

  const wsPath = "/@" + props.profile.username + "/public";
  const forks: string[] = [...props.profile.forks.values()];

  const forkedDocs = useResource(() => {
    const forkedDocs = forks.map((f) =>
      DocConnection.load(f, props.sessionStore)
    );

    return [
      forkedDocs,
      () => {
        forkedDocs.forEach((d) => d.dispose());
      },
    ];
  }, forks);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.userHeader}>
          <Avatar
            className={styles.avatar}
            src={props.profile.avatar_url || undefined}
            name={props.profile.username}
            size="150"
            round={true}
            textSizeRatio={2}
          />
          <h1>{props.profile.title}</h1>
          {joinedDate && (
            <div className={styles.userInfo}>Joined {joinedDate}</div>
          )}
        </div>
        {forkedDocs && <h2>Workspaces</h2>}
        <div className={styles.workspaces}>
          <Button
            onClick={() => {
              navigate(wsPath);
            }}>
            Public workspace by {props.profile.title}
          </Button>
        </div>
        {forkedDocs && <h2>Forked documents</h2>}
        <div className={styles.forks}>
          {forkedDocs.map((f) => (
            <>
              <Button
                key={f.identifier.toString()}
                onClick={() => {
                  navigate("/" + identifiersToPath(f.identifier));
                }}>
                {f.tryDoc ? f.tryDoc.title : "..."}
              </Button>
            </>
          ))}
        </div>
      </div>
    </>
  );
});

export default ProfileRenderer;
