import Tippy from "@tippyjs/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { SiMarkdown, SiTypescript, SiCss3 } from "react-icons/si";
import { CellLanguage } from "../../../models/CellModel";
import styles from "./LanguageSelector.module.css";

type Props = {
  language: CellLanguage;
  onChangeLanguage: (language: CellLanguage) => void;
  // onRemove: () => void;
};

const NotebookLanguageSelector: React.FC<Props> = observer((props) => {
  const languageName = (language: CellLanguage) => {
    switch (language) {
      case "typescript":
        return "TypeScript";
      case "markdown":
        return "Markdown";
      case "css":
        return "CSS";
    }
  };
  return (
    <>
      <Tippy
        content={
          <div className={styles["language-options"]}>
            <button
              title="TypeScript"
              onClick={() => props.onChangeLanguage("typescript")}>
              <SiTypescript className={styles["icon"]} />
              TypeScript
            </button>
            <button
              title="Markdown"
              onClick={() => props.onChangeLanguage("markdown")}>
              <SiMarkdown className={styles["icon"]} />
              Markdown
            </button>
            <button title="CSS" onClick={() => props.onChangeLanguage("css")}>
              <SiCss3 className={styles["icon"]} />
              CSS
            </button>
          </div>
        }
        placement={"bottom-end"}
        trigger={"click"}
        duration={0}
        offset={[0, 3]}
        interactive={true}>
        <button
          title={languageName(props.language)}
          className={styles["language-selector"]}>
          {languageName(props.language)}
        </button>
      </Tippy>
    </>
  );
});

export default NotebookLanguageSelector;
