import { observer } from "mobx-react-lite";
import styles from "./StartScreen.module.css";
import GitHubButton from "react-github-btn";
import { getStoreService } from "../../../store/local/stores";

export const StartScreen = observer(() => {
  const { navigationStore, sessionStore } = getStoreService();

  function onNewNotebookClick(e: any) {
    e.preventDefault();
    if (sessionStore.isLoggedIn) {
      navigationStore.showNewPageDialog();
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
                src="/assets/logo.svg"
                alt="TypeCell Logo Big"
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
              <div className={styles.separator}>
                <span>/</span>
              </div>
              <a
                className="button secondary"
                href="/"
                onClick={onNewNotebookClick}>
                Create new notebook
              </a>
            </div>
          </div>
        </section>

        <section className={styles.start_building}>
          <div className="container">
            <div className={styles.block}>
              <div className="row">
                <div className="row">
                  <h2>Start Building</h2>
                </div>
                <div className="row">
                  <span className={styles.subtitle}>
                    We are excited to see what you will do with TypeCell.
                    <br></br>Start your own notebook from scratch or start from
                    one of our examples.
                  </span>
                </div>
                <div className={styles.actions + " row"}>
                  <div className={styles.action}>
                    <a href="/" onClick={onNewNotebookClick}>
                      <div className={styles.icon}></div>
                      <span>Start from scratch</span>
                    </a>
                  </div>
                  {
                    // TODO: Implement
                  }
                  <div className={styles.action}>
                    <a href="/">
                      <div className={styles.icon}></div>
                      <span>Start from example</span>
                    </a>
                  </div>
                  <div className={styles.action}>
                    {
                      // TODO: Use react navigation
                    }
                    <a href="/docs/interactive-introduction.md">
                      <div className={styles.icon}></div>
                      <span>Start with demo</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
});
