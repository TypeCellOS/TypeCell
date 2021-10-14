import Tippy from "@tippyjs/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { VscFile, VscFileCode, VscFileMedia, VscTrash } from "react-icons/vsc";
import { CellLanguage } from "../../../models/CellModel";

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
          <div className="language-options">
            <button
              title="TypeScript"
              onClick={() => props.onChangeLanguage("typescript")}
              className={props.language === "typescript" ? "active" : ""}>
              <VscFileCode
                onClick={() => props.onChangeLanguage("typescript")}
              />
            </button>
            <button
              title="Markdown"
              onClick={() => props.onChangeLanguage("markdown")}
              className={props.language === "markdown" ? "active" : ""}>
              <VscFile />
            </button>
            <button
              title="Style"
              onClick={() => props.onChangeLanguage("css")}
              className={props.language === "css" ? "active" : ""}>
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
          className="language-selector">
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
