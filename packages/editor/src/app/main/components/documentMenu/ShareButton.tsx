import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { VscCloudUpload } from "react-icons/vsc";
import styles from "./ShareButton.module.css";

export const ShareButton: React.FC = observer(() => {
  const [shareMessageVisible, setShareMessageVisible] = useState(false);

  return (
    <button
      className={styles.share}
      onClick={() => {
        setShareMessageVisible(true);
        navigator.clipboard.writeText(window.location.href);
        setTimeout(() => setShareMessageVisible(false), 3000);
      }}>
      <VscCloudUpload
        style={{
          transform: "scale(1.6 )",
          marginRight: "8px",
          paddingTop: "2px",
        }}
      />
      <span>Share</span>
      <div
        className={styles.share_message}
        style={{
          display: shareMessageVisible ? "block" : "none",
        }}>
        <span>Copied link to clipboard!</span>
      </div>
    </button>
  );
});
