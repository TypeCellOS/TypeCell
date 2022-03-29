import { useParams } from "react-router-dom";
import Profile from "../main/components/Profile";

export const ProfileRoute = () => {
  let params = useParams();
  if (!params.userParam) {
    throw new Error("unexpected");
  }
  let owner = "@" + params.userParam;

  return <Profile owner={owner} />;
};
