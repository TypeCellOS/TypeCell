import Tippy from "@tippyjs/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { VscFile, VscFileCode, VscFileMedia } from "react-icons/vsc";
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
              <VscFileCode
                onClick={() => props.onChangeLanguage("typescript")}
              />
            </button>
            <button
              title="Markdown"
              onClick={() => props.onChangeLanguage("markdown")}>
              <VscFile />
            </button>
            <button title="CSS" onClick={() => props.onChangeLanguage("css")}>
              <VscFileMedia />
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
      {/* <button title="Delete" onClick={() => props.onRemove()}>
        <VscTrash />
      </button> */}
    </>
  );
});

export default NotebookLanguageSelector;
