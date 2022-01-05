import { observer } from "mobx-react-lite";
import styles from "./StartScreen.module.css";
// import GitHubButton from "react-github-btn";
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

  function onDocsClick(e: any) {
    e.preventDefault();
    navigationStore.navigateToTutorial();
  }

  return (
    <>
      <div className="page centered">
        <section className={styles.introduction}>
          {/* <div className={styles.github}>
            <GitHubButton
              href="https://github.com/YousefED/typecell-next"
              data-color-scheme="no-preference: dark; light: light; dark: dark;"
              data-show-count="true"
              aria-label="Star YousefED/typecell-next on GitHub">
              Star
            </GitHubButton>
          </div> */}
          <div className="container">
            <div className={styles.row}>
              <img
                className={styles.logo}
                src={app_logo}
                alt="TypeCell app logo"
              />
            </div>
            <div className={styles.row}>
              <h1>
                Explore, develop & share. <br></br> Live coding with interactive
                notebooks.
              </h1>
            </div>
            <div className={styles.row + " " + styles.buttons + " row"}>
              <a
                className="button primary"
                href="/docs/interactive-introduction.md"
                onClick={onDocsClick}>
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
                  The Reactive Runtime evaluates as-you-type, directly in your
                  browser.
                </span>
              </div>
              <div className={styles.separator}></div>
              <div className={styles.perk}>
                <div className={styles.icon}>
                  <img src={npm} alt="NPM logo" />
                </div>
                <span>
                  Built-in support for TypeScript, React, NPM and more.
                </span>
              </div>
              <div className={styles.separator}></div>
              <div className={styles.perk}>
                <div className={styles.icon}>
                  <img src={globe} alt="Globe icon" />
                </div>
                <span>Share your notebooks and collaborate in real-time.</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.notebooks}>
          <div className="container">
            <div className="row">
              <h2>Community Notebooks</h2>
              <p className={styles.text}>
                <a
                  href="https://discord.gg/TcJ9TRC3SV"
                  target="_blank"
                  rel="noreferrer">
                  <img
                    alt="Discord"
                    src="https://img.shields.io/badge/Join us on discord%20-%237289DA.svg?&style=for-the-badge&logo=discord&logoColor=white"
                  />
                </a>
              </p>
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
                    username: "niklas",
                    profileImageUrl: "",
                  }}
                  onClick={() => {
                    alert("todo");
                  }}></NotebookOverviewItem>
              </div>
              <div className={styles.notebook}>
                <NotebookOverviewItem
                  title="3D prototype. Work with new models and cameras"
                  description="Load a 3D model with adjustable camera interface"
                  previewImage={previewImage}
                  author={{
                    username: "yousef",
                    profileImageUrl: "",
                  }}
                  onClick={() => {
                    alert("todo");
                  }}></NotebookOverviewItem>
              </div>
              <div className={styles.notebook}>
                <NotebookOverviewItem
                  title="Use React graphs"
                  description="Use React graph library to display various bar charts"
                  previewImage={previewImage}
                  author={{
                    username: "pieter",
                    profileImageUrl: "",
                  }}
                  onClick={() => {
                    alert("todo");
                  }}></NotebookOverviewItem>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.section_separator}></div>
        <section className={styles.build}>
          <div className="container">
            <div>
              <h2>Intro @ LiveProg 2021</h2>

              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/paLS2M-XP6M"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen></iframe>
            </div>
          </div>
        </section>
        <div className={styles.section_separator}></div>
        <section className={styles.build}>
          <div className="container">
            <h2>Start building yourself</h2>
            <p>
              We are excited to see what you will do with TypeCell.<br></br>
              We'd love to get your feedback and ideas, so{" "}
              <a
                target="_blank"
                href="https://discord.gg/TcJ9TRC3SV"
                rel="noreferrer">
                <span>join us on Discord</span>
              </a>
              .
            </p>

            <div className={styles.buttons}>
              <div>
                <a
                  href="/docs/interactive-introduction.md"
                  onClick={onDocsClick}
                  className="button">
                  Try interactive tutorial
                </a>
              </div>
              <div>
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
          <div className="container">
            <div className={styles.links}>
              <ul>
                <li>
                  <a
                    href="/docs/interactive-introduction.md"
                    onClick={onDocsClick}>
                    <span>Interactive introduction</span>
                  </a>
                </li>
                {/* <li>
                  <a
                    target="_blank"
                    href="https://github.com/YousefED/typecell-next"
                    rel="noreferrer">
                    <span>Find us on GitHub</span>
                  </a>
                </li> */}
                <li>
                  <a
                    target="_blank"
                    href="https://discord.gg/TcJ9TRC3SV"
                    rel="noreferrer">
                    <span>Chat on discord</span>
                  </a>
                </li>
              </ul>
            </div>
            <div className={styles.bottom}>
              <span>{new Date().getFullYear()} TypeCell live programming</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
});
