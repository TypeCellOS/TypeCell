import { Editor } from "@tiptap/react";
import React, { useEffect, useRef, MutableRefObject, useState } from "react";
import { AiOutlineLink } from 'react-icons/ai';
import styles from "./LinkForm.module.css";

export type LinkFormProps = { editor: Editor };

const useFocus = () :[any, () => void] => {
  const htmlElRef: MutableRefObject<any> = useRef(null);
  const setFocus = (): void => {
    htmlElRef?.current?.focus?.()
  }

  return [ htmlElRef, setFocus]
}

const LinkForm: React.FC<LinkFormProps> = (props: LinkFormProps) => {

  const [url, setUrl] = useState("");
  const [inputRef, setInputFocus] = useFocus();
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if(props.editor.isFocused) {
      if(props.editor.isActive("link")) {
        setUrl(props.editor.getAttributes("link").href.substring(2));
      } else {
        setUrl("");
      }
    }

    if(document.getElementById("inlineMenuButton-link")?.getAttribute("aria-expanded")) {
      setExpanded(true);
      console.log("set to expanded");
    } else {
      setExpanded(false);
      console.log("set to expanded");
    }
  });

  useEffect(() => {
    setInputFocus();
    console.log("triggered");
  }, [expanded])



  const handleSubmit = (e: any) => {

    const absoluteUrl = "//" + url;

    e.preventDefault();
    if(url == "") {
      props.editor.chain().focus().unsetLink().run();
    } else {
      props.editor.chain().focus().setLink({ href: absoluteUrl }).run();
      setUrl("");
    }
  }

  const handleChange = (e: any) => {
    setUrl(e.target.value);
  }

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        {/*
        <div className={styles.linkIconContainer} >
          <AiOutlineLink />
        </div>
        */}
        <input className={styles.inputField} type="text" ref={inputRef} placeholder="URL" value={url} onChange={handleChange}/>
        <input className={styles.submitButton} type="submit" value="OK"/>
      </form>
    </div>
  );
}

export default LinkForm;