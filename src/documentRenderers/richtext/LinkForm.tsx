import { Editor } from "@tiptap/react";
import React, { useEffect, useState } from "react";
import { AiOutlineLink } from 'react-icons/ai';
import styles from "./LinkForm.module.css";

export type LinkFormProps = { editor: Editor };

const LinkForm: React.FC<LinkFormProps> = (props: LinkFormProps) => {

  const [url, setUrl] = useState("");

  useEffect(() => {
      if(props.editor.isFocused) {
        if(props.editor.isActive("link")) {
          setUrl(props.editor.getAttributes("link").href);
        } else {
          setUrl("");
        }
      }
      
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if(url == "") {
      props.editor.chain().focus().unsetLink().run();
    } else {
      props.editor.chain().focus().setLink({ href: url }).run();
      setUrl("");
    }
  }

  const handleChange = (e: any) => {
    setUrl(e.target.value);
  }

  return (
      <form onSubmit={handleSubmit}>
        <div className={styles.linkIconContainer} >
          <AiOutlineLink />
        </div>
        <input className={styles.inputField} type="text" value={url} onChange={handleChange}/>
        <input className={styles.submitButton} type="submit" value=">"/>
      </form>
  );
}

export default LinkForm;