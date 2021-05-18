import { Editor } from "@tiptap/react";
import React, { useEffect, useState } from "react";
import { AiOutlineLink } from 'react-icons/ai';
import { IconContext } from "react-icons";

import "./LinkForm.css";

export type LinkFormProps = { editor: Editor };

const LinkForm: React.FC<LinkFormProps> = (props: LinkFormProps) => {

  const [url, setUrl] = useState("");

  useEffect(() => {
      console.log("triggered");
      console.log(props.editor.isActive("link"));
      
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
    console.log("changed to ", url);
  }

  return (
      <form onSubmit={handleSubmit}>
        <IconContext.Provider value={{ className: "link-icon" }}>
          <div className={'link-icon-container'} >
            <AiOutlineLink />
          </div>
        </IconContext.Provider>
        <input className={'input-field'} type="text" value={url} onChange={handleChange}/>
        <input className={'submit-button'} type="submit" value=">"/>
      </form>
  );
}

export default LinkForm;