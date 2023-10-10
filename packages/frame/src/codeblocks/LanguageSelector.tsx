import {
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import React, { useState } from "react";
import { SiCss3, SiTypescript } from "react-icons/si";

import styles from "./LanguageSelector.module.css";

type CellLanguage = "typescript" | "css";

type Props = {
  language: CellLanguage;
  onChangeLanguage: (language: CellLanguage) => void;
  // onRemove: () => void;
};

// TODO: this is rerendered whenever the user types :/
const LanguageSelector: React.FC<Props> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-end",
  });

  const dismiss = useDismiss(context);
  const click = useClick(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  const languageName = (language: CellLanguage) => {
    switch (language) {
      case "typescript":
        return "TypeScript";
      case "css":
        return "CSS";
    }
  };
  return (
    <>
      <button
        ref={refs.setReference}
        title={"Click to change language"}
        {...getReferenceProps()}
        className={styles.languageSelector}>
        {languageName(props.language)}
      </button>
      {isOpen && (
        <div
          ref={refs.setFloating}
          className={styles.languageOptions}
          style={floatingStyles}
          {...getFloatingProps()}>
          <button
            title="TypeScript"
            onClick={() => {
              props.onChangeLanguage("typescript");
              setIsOpen(false);
            }}>
            <SiTypescript className={styles.icon} />
            TypeScript
          </button>
          <button
            title="CSS"
            onClick={() => {
              props.onChangeLanguage("css");
              setIsOpen(false);
            }}>
            <SiCss3 className={styles.icon} />
            CSS
          </button>
        </div>
      )}
    </>
  );
};

export default LanguageSelector;
