import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router-dom";
import { getStoreService } from "../../../../store/local/stores";
import buttonStyles from "../../../../styles/buttons.module.css";
import {
  OpenNewPageDialog,
  toDocs,
  toIdentifierString,
  toNewGuestNotebook,
  toTutorial,
} from "../../../routes/routes";
import { NotebookOverviewItem } from "../NotebookOverviewItem";
import apiPreviewImage from "./assets/api_preview.jpg";
import chartsPreviewImage from "./assets/charts_preview.jpg";
import globe from "./assets/globe.svg";
import intro from "./assets/intro.gif";
import lightning from "./assets/lightning.svg";
import npm from "./assets/npm.svg";
import timePreviewImage from "./assets/time_preview.jpg";
import styles from "./StartScreen.module.css";

export const StartScreen = observer(() => {
  const { sessionStore } = getStoreService();
  const navigate = useNavigate();
  function onNewNotebookClick(e: any) {
    e.preventDefault();
    if (sessionStore.isLoggedIn) {
      OpenNewPageDialog(navigate);
    } else {
      navigate(toNewGuestNotebook());
    }
  }

  return (
    <>
      <div className={styles.page + "  centered"}>
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
            <div>
              <h1>Create &amp; share live interactive notebooks</h1>
              <p>
                TypeCell is an open source Typescript live programming
                environment. <br /> Running code has never been easier :)
              </p>
            </div>
            <div className={styles.buttons}>
              <Link
                className={`${buttonStyles.button} ${buttonStyles.primary}`}
                to={toTutorial()}>
                Try interactive tutorial
              </Link>

              <a
                className={`${buttonStyles.button} ${buttonStyles.secondary}`}
                href="/"
                onClick={onNewNotebookClick}>
                Create new notebook
              </a>
            </div>
            <div className={styles.code_block}>
              <img src={intro} alt="TypeCell Demo" />
            </div>
          </div>
        </section>

        <section className={styles.perksSection}>
          <div className={styles.perks}>
            <div className={styles.perk}>
              <div className={styles.icon}>
                <img src={lightning} alt="Lightning icon" />
              </div>
              <h3>Reactive Runtime</h3>
              <span>
                The Reactive Runtime evaluates as-you-type, directly in your
                browser.
              </span>
            </div>

            <div className={styles.perk}>
              <div className={styles.icon}>
                <img src={npm} alt="NPM logo" />
              </div>
              <h3>Full ecosystem</h3>
              <span>Built-in support for TypeScript, React, NPM and more.</span>
            </div>

            <div className={styles.perk}>
              <div className={styles.icon}>
                <img src={globe} alt="Globe icon" />
              </div>
              <h3>Collaborate</h3>
              <span>Share your notebooks and collaborate in real-time.</span>
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
              <div className={styles.buttons + " " + styles.social}>
                <a
                  href="https://discord.gg/TcJ9TRC3SV"
                  target="_blank"
                  rel="noreferrer">
                  <img
                    alt="Discord"
                    src="https://img.shields.io/badge/Join us on discord%20-%237289DA.svg?&style=for-the-badge&logo=discord&logoColor=white"
                  />
                </a>
                <a
                  href="https://matrix.to/#/#typecell-space:matrix.org"
                  target="_blank"
                  rel="noreferrer">
                  <img
                    alt="Matrix"
                    src="https://img.shields.io/badge/Chat on matrix%20-%23000.svg?&style=for-the-badge&logo=matrix&logoColor=white"
                  />
                </a>
              </div>
            </div>

            <div className={styles.overview + " row"}>
              <div className={styles.notebook}>
                <NotebookOverviewItem
                  title="It’s all about timing"
                  description="Explore TypeCell's reactivity with the help of time"
                  previewImage={timePreviewImage}
                  author={{
                    username: "niklas",
                    profileImageUrl: "",
                  }}
                  to={toIdentifierString(
                    "@niklas/time"
                  )}></NotebookOverviewItem>
              </div>
              <div className={styles.notebook}>
                <NotebookOverviewItem
                  title="Fun with charts"
                  description="Visualize weather data with two React chart libraries"
                  previewImage={chartsPreviewImage}
                  author={{
                    username: "yousef",
                    profileImageUrl: "",
                  }}
                  to={toIdentifierString(
                    "@yousef/charts"
                  )}></NotebookOverviewItem>
              </div>
              <div className={styles.notebook}>
                <NotebookOverviewItem
                  title="File upload using API"
                  description="Connect a React file uploader with an API"
                  previewImage={apiPreviewImage}
                  author={{
                    username: "niklas",
                    profileImageUrl: "",
                  }}
                  to={toIdentifierString("@niklas/api")}></NotebookOverviewItem>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.section_separator}></div>
        {/* <section className={styles.build}>
          <div className="container">
            <div>
              <h2>Intro @ LiveProg 2021</h2>

              <iframe
                width="560"
                height="315"
                src="https://www.youtube-nocookie.com/embed/paLS2M-XP6M"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen></iframe>
            </div>
          </div>
        </section> */}
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
              <Link to={toTutorial()} className={`${buttonStyles.button}`}>
                Try interactive tutorial
              </Link>
              <a
                className={`${buttonStyles.button} ${buttonStyles.secondary}`}
                onClick={onNewNotebookClick}
                href="/">
                Create new notebook
              </a>
            </div>
          </div>
        </section>
      </div>
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.links}>
            <ul>
              <li>
                <Link to={toTutorial()}>
                  <span>Interactive introduction</span>
                </Link>
              </li>
              <li>
                <Link to={toDocs()}>
                  <span>Documentation</span>
                </Link>
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
              <li>
                <a
                  target="_blank"
                  href="https://matrix.to/#/#typecell-space:matrix.org"
                  rel="noreferrer">
                  <span>Chat on Matrix</span>
                </a>
              </li>
            </ul>
          </div>
          <div className={styles.bottom}>
            <span>{new Date().getFullYear()} TypeCell live programming</span>
          </div>
        </div>
      </footer>
    </>
  );
});
