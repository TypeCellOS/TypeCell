import { useParams } from "react-router-dom";
import Profile from "../main/components/Profile";

export const ProfileRoute = () => {
  let params = useParams();
  if (!params.userParam || !params.userParam.startsWith("@")) {
    throw new Error("unexpected");
  }

  return <Profile owner={params.userParam} />;
};
