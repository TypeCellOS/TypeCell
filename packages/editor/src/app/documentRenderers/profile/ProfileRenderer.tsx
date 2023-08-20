import { observer } from "mobx-react-lite";
import React from "react";
import { Identifier } from "../../../identifiers/Identifier";
import ProfileResource from "../../../store/ProfileResource";

type Props = {
  profile: ProfileResource;
  subIdentifiers: Identifier[];
};

const ProfileRenderer: React.FC<Props> = observer((props) => {
  return (
    <div>
      <h1>Hello {props.profile.title}</h1>
      <h2>Workspaces</h2>
    </div>
  );
});

export default ProfileRenderer;
