import { observer } from "mobx-react-lite";
import styles from "./StartScreen.module.css";
import GitHubButton from "react-github-btn";
import { getStoreService } from "../../../store/local/stores";

export const StartScreen = observer(() => {
  const { navigationStore, sessionStore } = getStoreService();

  function onNewNotebookClick(e: any) {
    e.preventDefault();
    if (sessionStore.isLoggedIn) {
      navigationStore.showNewNotebookDialog();
    } else {
      // TODO: implement for non logged-in
    }
  }

  return (
    <>
      <div className="page">
        <section className={styles.introduction}>
          <div className={styles.github}>
            <GitHubButton
              href="https://github.com/YousefED/typecell-next"
              data-color-scheme="no-preference: dark; light: light; dark: dark;"
              data-show-count="true"
              aria-label="Star YousefED/typecell-next on GitHub">
              Star
            </GitHubButton>
          </div>
          <div className="container">
            <div className={styles.row + " row"}>
              <img
                className={styles.logo}
                src="/assets/app_logo.svg"
                alt="TypeCell app logo"
              />
            </div>
            <div className={styles.row + " row"}>
              <h1>
                Explore, develop & share <br></br>with the online interactive
                notebook
              </h1>
            </div>
            <div className={styles.row + " " + styles.buttons + " row"}>
              {
                // TODO: Use react navigation
              }
              <a
                className="button primary"
                href="/docs/interactive-introduction.md">
                Try interactive tutorial
              </a>

              <a
                className="button secondary"
                href="/"
                onClick={onNewNotebookClick}>
                Create new notebook
              </a>
            </div>
          </div>
        </section>

        <section className={styles.demo}>
          <div className="container">
            <div className={styles.code_block}>
              <img src="/assets/demo.png" alt="TypeCell Demo" />
            </div>
          </div>
        </section>

        <section className={styles.perks}>
          <div className="container">
            <div className={styles.perk_row + " row"}>
              <div className={styles.perk}>
                <div className={styles.icon}></div>
                <span>
                  Execute code changes in realtime, directly in your browser
                </span>
              </div>
              <div className={styles.separator}></div>
              <div className={styles.perk}>
                <div className={styles.icon}></div>
                <span>Instantly use npm modules in your notebook</span>
              </div>
              <div className={styles.separator}></div>
              <div className={styles.perk}>
                <div className={styles.icon}></div>
                <span>Colaborate with anyone in an instant</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
});
