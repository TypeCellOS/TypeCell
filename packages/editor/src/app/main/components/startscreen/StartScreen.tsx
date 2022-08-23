import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router-dom";
import app_logo from "../../../../assets/app_logo.svg";
import { getStoreService } from "../../../../store/local/stores";
import {
  OpenNewDocumentDialog,
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
      OpenNewDocumentDialog(navigate);
    } else {
      navigate(toNewGuestNotebook());
    }
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
              <Link className="button primary" to={toTutorial()}>
                Try interactive tutorial
              </Link>

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
                With TypeCell you can easily share your work with others. Below
                we listed the Notebooks made by some of our users. View and
                interact with a Notebook or use it as a starting point for your
                next project.
              </p>
              <a
                className={styles.discord}
                href="https://discord.gg/TcJ9TRC3SV"
                target="_blank"
                rel="noreferrer">
                <img
                  alt="Discord"
                  src="https://img.shields.io/badge/Join us on discord%20-%237289DA.svg?&style=for-the-badge&logo=discord&logoColor=white"
                />
              </a>
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
        <section className={styles.build}>
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
                <Link to={toTutorial()} className="button">
                  Try interactive tutorial
                </Link>
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
