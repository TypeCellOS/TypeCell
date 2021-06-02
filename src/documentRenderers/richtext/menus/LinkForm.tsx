import { Editor } from "@tiptap/react";
import React, { useEffect, useState } from "react";
import styles from "./LinkForm.module.css";

export type LinkFormProps = { editor: Editor };

const LinkForm: React.FC<LinkFormProps> = (props: LinkFormProps) => {
  /**
   * The input form is a controlled component and uses the url state.
   *
   * The "value" attribute of the input form is set to this state,
   * and it gets updated throughout the functions in this file.
   */
  const [url, setUrl] = useState("");

  /**
   * Updates the url state in the background(when link menu is out of focus)
   *
   * If the selection has an active link mark, removes the first two characters:
   * "//", and updates url state. Gets called when the url state changes
   */
  useEffect(() => {
    if (props.editor.isFocused) {
      if (props.editor.isActive("link")) {
        console.log("side effect??!! this means LinkForm is rendered again");
        const link = props.editor.getAttributes("link");
        setUrl(props.editor.getAttributes("link").href.substring(2));
      } else {
        setUrl("");
      }
    }
  });

  /**
   * Handles form submit
   *
   * Called when the submit button is clicked. Will remove the link mark
   * if the url state is empty, and set a link if its not. The url that will
   * be set is prepended with "//" to force the browser open it as an absolute
   * path.
   */
  const handleSubmit = (e: any) => {
    const absoluteUrl = "//" + url;

    e.preventDefault();
    if (url == "") {
      props.editor.chain().focus().unsetLink().run();
    } else {
      props.editor.chain().focus().setLink({ href: absoluteUrl }).run();
      setUrl("");
    }
  };

  /**
   * Updates the url state
   */
  const handleChange = (e: any) => {
    setUrl(e.target.value);
  };

  return (
    // TODO replace this placeholder wrapper by AtlasKit styling
    // solely exist to be able to see the form
    <div className={styles.placeHolderWrapper}>
      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            className={styles.inputField}
            type="text"
            placeholder="URL"
            value={url}
            onChange={handleChange}
          />
          <input className={styles.submitButton} type="submit" value="OK" />
        </form>
      </div>
    </div>
  );
};

export default LinkForm;
