import { observer } from "mobx-react-lite";
import styles from "./StartScreen.module.css";
import GitHubButton from "react-github-btn";
import { getStoreService } from "../../../../store/local/stores";
import { NotebookOverviewItem } from "../NotebookOverviewItem";
import app_logo from "../../../../assets/app_logo.svg";
import intro from "./assets/intro.gif";
import lightning from "./assets/lightning.svg";
import globe from "./assets/globe.svg";
import npm from "./assets/npm.svg";
import previewImage from "./assets/notebook_preview.jpg";

export const StartScreen = observer(() => {
  const { navigationStore, sessionStore } = getStoreService();

  function onNewNotebookClick(e: any) {
    e.preventDefault();
    if (sessionStore.isLoggedIn) {
      navigationStore.showNewNotebookDialog();
    } else {
      navigationStore.navigateToNewGuestNotebook();
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
                src={app_logo}
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
              <img src={intro} alt="TypeCell Demo" />
            </div>
          </div>
        </section>

        <section className={styles.perks}>
          <div className="container">
            <div className={styles.perk_row + " row"}>
              <div className={styles.perk}>
                <div className={styles.icon}>
                  <img src={lightning} alt="Lightning icon" />
                </div>
                <span>
                  Execute code changes in realtime, directly in your browser
                </span>
              </div>
              <div className={styles.separator}></div>
              <div className={styles.perk}>
                <div className={styles.icon}>
                  <img src={npm} alt="NPM logo" />
                </div>
                <span>Instantly use npm modules in your notebook</span>
              </div>
              <div className={styles.separator}></div>
              <div className={styles.perk}>
                <div className={styles.icon}>
                  <img src={globe} alt="Globe icon" />
                </div>
                <span>Colaborate with anyone in an instant</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.notebooks}>
          <div className="container">
            <div className="row">
              <h2>Community Notebooks</h2>
              <p className={styles.text}>
                With TypeCell you can easily share your work with others. Below
                we listed the Notebooks made by some of our users. View and
                interact with a Notebook or use it as a starting point for your
                next project.
              </p>
            </div>

            <div className={styles.overview + " row"}>
              <div className={styles.notebook}>
                <NotebookOverviewItem
                  title="Import & transform CSV"
                  description="See if we can import and manipulate some data"
                  previewImage={previewImage}
                  author={{
                    username: "Niklas",
                    profileImageUrl: "",
                  }}
                  onClick={() => {
                    alert("x");
                  }}></NotebookOverviewItem>
              </div>
              <div className={styles.notebook}>
                <NotebookOverviewItem
                  title="3D prototype. Work with new models and cameras"
                  description="Load a 3D model with adjustable camera interface"
                  previewImage={previewImage}
                  author={{
                    username: "Yousef",
                    profileImageUrl: "",
                  }}
                  onClick={() => {
                    alert("x");
                  }}></NotebookOverviewItem>
              </div>
              <div className={styles.notebook}>
                <NotebookOverviewItem
                  title="Use React graphs"
                  description="Use React graph library to display various bar charts"
                  previewImage={previewImage}
                  author={{
                    username: "Pieter",
                    profileImageUrl: "",
                  }}
                  onClick={() => {
                    alert("x");
                  }}></NotebookOverviewItem>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.section_separator}></div>

        <section className={styles.build}>
          <div className="container">
            <div className="row">
              <h2>Or start building yourself</h2>

              <p>
                We are excited to see what you will do with TypeCell. <br></br>
                Start your own notebook from scratch or start from one of our
                examples.
              </p>
            </div>
            <div className={styles.buttons}>
              <div className="row">
                <a href="/docs/interactive-introduction.md" className="button">
                  Try interactive tutorial
                </a>
              </div>
              <div className="row">
                <a
                  className={styles.link}
                  onClick={onNewNotebookClick}
                  href="/">
                  Create new Notebook
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <div className="container"></div>
        </footer>
      </div>
    </>
  );
});
