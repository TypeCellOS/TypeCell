import { observer } from "mobx-react-lite";
import { SessionStore } from "../../../../store/local/SessionStore";
import buttonStyles from "../../../../styles/buttons.module.css";
import styles from "./StartScreen.module.css";
import globe from "./assets/globe.svg";
import intro from "./assets/intro.gif";
import lightning from "./assets/lightning.svg";
import npm from "./assets/npm.svg";

export const AILanding = observer((props: { sessionStore: SessionStore }) => {
  // const { sessionStore } = props;
  // const navigate = useNavigate();
  // function onNewNotebookClick(e: any) {
  //   e.preventDefault();
  //   if (sessionStore.isLoggedIn) {
  //     OpenNewPageDialog(navigate);
  //   } else {
  //     navigate(toNewGuestNotebook());
  //   }
  // }

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
              <h1>Live pair programming. With AI.</h1>
              <p>
                Instruct GPT to write your programs. Instant feedback. One-click
                deploy when ready.
              </p>
            </div>
            <div className={styles.buttons}>
              <form
                id="sib-form"
                method="POST"
                action="https://5a8bdf3f.sibforms.com/serve/MUIEANqwOcT6fR0aEnzonLvS2Mgvhe0M9gIoSdT_biqHwGfW9f4nZ_xRAwZZDb3UR_EnuklgC3ILQjR93zMR-TDcJD67Jj-Nq_i7GhvSZKUK2lrBIPZzDTDkEQVSxlnU8tNkUeIcdRy4lDbHh6Lyd5OC17C46ei6265lqv-hqCfOgXDqgbJh1Jq5IawldXwT7_OUeX2E2K3w0HG6">
                <input
                  type="email"
                  name="EMAIL"
                  required
                  placeholder="Email address"></input>
                <button
                  type="submit"
                  className={`${buttonStyles.button} ${buttonStyles.primary}`}>
                  Get early access
                </button>
              </form>
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
              <h2>Join our community</h2>
              {/* <p className={styles.text}>
                Join our community to be part of the ride.
              </p> */}
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
          </div>
        </section>

        {/* <div className={styles.section_separator}></div>
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
        </section> */}
      </div>
      {/* <footer className={styles.footer}>
        <div className="container">
          <div className={styles.bottom}>
            <span>{new Date().getFullYear()} TypeCell live programming</span>
          </div>
        </div>
      </footer> */}
    </>
  );
});
