import { Link } from "react-router-dom";
import logo_with_text from "../../../assets/logo_with_text.svg";
import { toStartScreen } from "../../routes/routes";
import styles from "./Logo.module.css";

export const Logo = () => {
  return (
    <Link className={styles.logo} to={toStartScreen()}>
      <img src={logo_with_text} alt="TypeCell Logo" />
    </Link>
  );
};
