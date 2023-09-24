import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SessionStore } from "../../../../store/local/SessionStore";
// import { NotebookOverviewItem } from "../../../matrix-auth/routes/overview/NotebookOverviewItem";
import { toDocs, toNewGuestNotebook, toTutorial } from "../../../routes/routes";
import styles from "./StartScreen.module.css";
import intro from "./assets/intro.gif";

export const StartScreen = observer((props: { sessionStore: SessionStore }) => {
  const { sessionStore } = props;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/" && sessionStore.loggedInUserId) {
      // logged in, redirect to main workspace.
      // homepage is still accessible via /home
      navigate({
        pathname: "/@" + sessionStore.loggedInUserId + "/public",
      });
    }
  }, [location.pathname, sessionStore.loggedInUserId, navigate]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onNewNotebookClick(e: any) {
    e.preventDefault();
    if (sessionStore.isLoggedIn) {
      // OpenNewPageDialog(navigate);
    } else {
      navigate(toNewGuestNotebook());
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>
            Interactive documents. <strong>Reimagined.</strong>
            <br />
          </h1>
          <p>
            TypeCell is a fresh take on what documents and software can look
            like. Think <em>Notion + Jupyter Notebooks</em>. Open Source.
          </p>
          <div className={styles.ctaButtons}>
            <Link to={toTutorial()}>Try interactive tutorial</Link>
            <a className={styles.simple} onClick={onNewNotebookClick} href="/">
              Create new notebook
            </a>
          </div>
        </div>
        <div className={styles.headerMedia}>
          <div className={styles.code_block}>
            <img src={intro} alt="TypeCell Demo" />
          </div>
        </div>
      </header>
      <div className={styles.page + "  centered"}>
        <section className={styles.storySection + " " + styles.uneven}>
          <div className={styles.content + " " + styles.story}>
            <div className={""}>
              <img src={intro} alt="TypeCell Demo" />
            </div>
            <div className={""}>
              <h4>Break-free from your tools with hackable software</h4>
              <p>
                Why can't we easily insert interactive elements like charts,
                maps or anything else you can think of into our documents?
                Modern software is incredibly powerful. But as users, we're
                limited by the use-cases envisioned by its creators.
              </p>
              <p>
                Hackable, or Malleable software, puts users in control by making
                tools customizable with{" "}
                <a
                  href="https://www.inkandswitch.com/end-user-programming/"
                  target="_blank"
                  rel="noreferrer">
                  End-User Programming
                </a>
                .
              </p>
              <p>
                Use TypeCell to create and share your knowledge base of live,
                interactive documents. With <em>Code Blocks</em>, you always
                have a powerful programming environment at your fingertips.
              </p>
            </div>
          </div>

          <div className={styles.perks + " " + styles.content}>
            <div className={styles.perk}>
              <h3>Notion-style documents</h3>
              <span>
                Create block-based documents and use code blocks for advanced
                functionality and interactivity.
              </span>
            </div>

            <div className={styles.perk}>
              <h3>Local-first architecture</h3>
              <span>
                Built on the principles of{" "}
                <a
                  href="https://www.inkandswitch.com/local-first/"
                  target="_blank"
                  rel="noreferrer">
                  local-first software
                </a>
                ; the architecture that makes apps like Linear fast and fun to
                use.
              </span>
            </div>

            <div className={styles.perk}>
              <h3>Collaborate</h3>
              <span>
                We always liked multiplayer mode best :) Share your documents
                and collaborate in real-time, powered by{" "}
                <a
                  href="https://github.com/yjs/yjs"
                  target="_blank"
                  rel="noreferrer">
                  Yjs CRDT
                </a>
                .
              </span>
            </div>
          </div>
        </section>

        <div className={styles.section_separator} role="separator"></div>
        <section className={styles.storySection + " " + styles.sdf}>
          <div className={styles.content + " " + styles.story}>
            <div className={""}>
              <h4>Simplify the programming experience</h4>
              <p>
                Software development is becoming more and more complex and
                thereby, less transparent and inclusive.
              </p>
              <p>
                We want to empower the next generation of makers by embedding a
                programming environment that's Live, Simple and Fun to use.
              </p>
            </div>
            <div className={""}>
              <img src={intro} alt="TypeCell Demo" />
            </div>
          </div>

          <div className={styles.perks + " " + styles.content}>
            <div className={styles.perk}>
              <h3>Live Reactive Runtime</h3>
              <span>
                The Reactive Runtime evaluates as-you-type, directly in your
                browser.
              </span>
            </div>

            <div className={styles.perk}>
              <h3>Full ecosystem support</h3>
              <span>
                Built-in support for TypeScript and React. Import libraries
                directly from NPM or share code across documents.
              </span>
            </div>

            <div className={styles.perk}>
              <h3>Powered by VS Code</h3>
              <span>
                Code blocks are powered by Monaco, the editor you know from
                Visual Studio Code.
              </span>
            </div>
          </div>
        </section>

        <div className={styles.section_separator} role="separator"></div>
        <section className={styles.storySection + " " + styles.sdf}>
          <div className={styles.content + " " + styles.story}>
            <div className={""}>
              <img src={intro} alt="TypeCell Demo" />
            </div>
            <div className={""}>
              <h4>Join the TypeCell community</h4>
              <p>
                We're just getting started, and invite you to shape this journey
                together.
              </p>
              <p>
                Create your own workspace and join the community on{" "}
                <a
                  target="_blank"
                  href="https://discord.gg/TcJ9TRC3SV"
                  rel="noreferrer">
                  Discord
                </a>{" "}
                to share your thoughts, or contribute to the project on{" "}
                <a
                  target="_blank"
                  href="https://github.com/TypeCellOS/TypeCell"
                  rel="noreferrer">
                  GitHub
                </a>
                .
              </p>
              <p>
                Dive into the sneak-peeks below to check out some features we
                plan to work on next:
              </p>
            </div>
          </div>
          <div className={styles.perks + " " + styles.content}>
            <div className={styles.perk}>
              <h3>AI Integration</h3>
              <span>
                An AI-programmer that codes live alongside you, ensuring you
                always remain in control.
                <br />
                <a
                  href="https://twitter.com/YousefED/status/1599805936280907776"
                  target="_blank"
                  rel="noreferrer">
                  Preview experiment
                </a>
              </span>
            </div>
            <div className={styles.perk}>
              <h3>Plugins &amp; Shareable Blocks</h3>
              <span>
                Extend the TypeCell environment with Plugins and custom
                shareable Blocks.
                <br />
                <a
                  href="https://twitter.com/YousefED/status/1677342430545301504"
                  target="_blank"
                  rel="noreferrer">
                  Preview experiment
                </a>
              </span>
            </div>
            <div className={styles.perk}>
              <h3>Instant deploys</h3>
              <span>
                With just a single click, build and deploy TypeCell pages,
                simplifying the process of creating and sharing interactive
                websites.
              </span>
            </div>
          </div>
        </section>
        {/* <section className={styles.notebooks}>
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
                  
                  }></NotebookOverviewItem>
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
                  
                  }></NotebookOverviewItem>
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
                  to={
                    "TODO"
                  }></NotebookOverviewItem>
              </div>
            </div>
          </div>
        </section> */}

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
        {/* <div className={styles.section_separator}></div>
        <section className={styles.build + " " + styles.content}>
          <div>
            <h2>Start building yourself</h2>
            <p>
              We are excited to see what you will do with TypeCell.<br></br>
              We'd love to get your feedback and ideas, so{" "}
              <a
                target="_blank"
                href="https://discord.gg/TcJ9TRC3SV"
                rel="noreferrer">
                <span>join us on Discord</span>
              </a>{" "}
              or{" "}
              <a
                target="_blank"
                href="https://github.com/TypeCellOS/TypeCell"
                rel="noreferrer">
                <span>contribute on GitHub</span>
              </a>
              . .
            </p>

            <div className={styles.ctaButtons}>
              <Link to={toTutorial()}>Try interactive tutorial</Link>
              <a
                className={styles.simple}
                onClick={onNewNotebookClick}
                href="/">
                Create new notebook
              </a>
            </div>
          </div>
        </section> */}
      </div>
      <footer className={styles.footer}>
        <div>
          <div className={styles.links}>
            <h4>Community</h4>
            <ul>
              <li>
                <a
                  target="_blank"
                  href="https://github.com/TypeCellOS/TypeCell"
                  rel="noreferrer">
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  href="https://twitter.com/TypeCellOS"
                  rel="noreferrer">
                  <span>Twitter / X</span>
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  href="https://discord.gg/TcJ9TRC3SV"
                  rel="noreferrer">
                  <span>Chat on Discord</span>
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

          <div className={styles.links}>
            <h4>Documentation</h4>
            <ul>
              <li>
                <Link to={toDocs()}>
                  <span>Introduction</span>
                </Link>
              </li>
              <li>
                <Link to={toTutorial()}>
                  <span>Tutorial</span>
                </Link>
              </li>
              <li>
                <Link to={toTutorial()}>
                  <span>Manual</span>
                </Link>
              </li>
              <li>
                <Link to={toTutorial()}>
                  <span>Demos</span>
                </Link>
              </li>
            </ul>
          </div>
          <div className={styles.links}>
            <h4>Get started</h4>
            <ul>
              <li>
                <Link to={toTutorial()}>
                  <span>Create account</span>
                </Link>
              </li>
              <li>
                <Link to={toDocs()}>
                  <span>Login</span>
                </Link>
              </li>
            </ul>
          </div>
          {/* <div className={styles.links}>
            <h4>Stay updated</h4>
            <ul>
              <li>
                <Link to={toTutorial()}>
                  <span>Create account</span>
                </Link>
              </li>
              <li>
                <Link to={toDocs()}>
                  <span>Login</span>
                </Link>
              </li>
            </ul>
          </div> */}
        </div>
        {/* <div className={styles.bottom}>
          <span>{new Date().getFullYear()} TypeCell live programming</span>
        </div> */}
      </footer>
    </>
  );
});
