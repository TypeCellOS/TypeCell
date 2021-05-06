import { observer } from "mobx-react-lite";
import React from "react";

import styles from "./RichTextRenderer.module.css";

export type Action = {
  type: string;
  data: any;
  dispatcher?: React.Dispatch<Action>;
};
type RichTextConsoleProps = {
  dispatcher: React.Dispatch<Action>;
};
const RichTextConsole: React.FC<RichTextConsoleProps> = observer((props) => {
  const opt = styles["rich-text-option"];
  const { dispatcher } = props;
  return (
    <div id={styles["rich-text-console"]} className={styles.manifest}>
      <ul id={styles["console-list"]} className={styles.manifest}>
        <li
          className={opt}
          id="block-adder"
          onClick={() => {
            dispatcher({ type: "add", data: "new", dispatcher });
            console.log(`+ sign clicked`);
          }}>
          +
        </li>
        <li
          className={opt}
          id="block-deleter"
          onClick={() => {
            window.alert(`unfinished work`);
            return;
            dispatcher({ type: "delete", data: "new", dispatcher });
            console.log(`- sign clicked`);
          }}>
          -
        </li>
      </ul>
    </div>
  );
});

export default RichTextConsole;
