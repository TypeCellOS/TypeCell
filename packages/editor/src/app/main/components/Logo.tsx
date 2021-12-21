import { getStoreService } from "../../../store/local/stores";
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
      <img src="/assets/logo_with_text.svg" alt="TypeCell Logo" />
    </a>
  );
};
