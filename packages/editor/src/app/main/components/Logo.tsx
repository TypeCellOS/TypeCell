import { getStoreService } from "../../../store/local/stores";
import logo_with_text from "../../../assets/logo_with_text.svg";
import styles from "./Logo.module.css";

export const Logo = () => {
  const navigationStore = getStoreService().navigationStore;

  return (
    <a
      href="/"
      className={styles.logo}
      onClick={(e) => {
        e.preventDefault();
        navigationStore.showStartScreen();
      }}>
      <img src={logo_with_text} alt="TypeCell Logo" />
    </a>
  );
};
