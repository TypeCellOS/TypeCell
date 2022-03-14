import { useNavigate } from "react-router-dom";
import logo_with_text from "../../../assets/logo_with_text.svg";
import { gotoStartScreen } from "../../routes/routes";
import styles from "./Logo.module.css";

export const Logo = () => {
  const navigate = useNavigate();

  return (
    <a
      href="/"
      className={styles.logo}
      onClick={(e) => {
        e.preventDefault();
        gotoStartScreen(navigate);
      }}>
      <img src={logo_with_text} alt="TypeCell Logo" />
    </a>
  );
};
