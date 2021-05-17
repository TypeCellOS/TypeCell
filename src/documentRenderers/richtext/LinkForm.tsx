import { Editor } from "@tiptap/react";
import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { AiOutlineLink } from 'react-icons/ai';
import { IconContext } from "react-icons";

import "./LinkForm.css";

export type LinkFormProps = { editor: Editor };

const LinkForm: React.FC<LinkFormProps> = forwardRef((props: LinkFormProps, ref: any) => {

  const [url, setUrl] = useState("");
  const [expanded, setExpanded] = useState(false);

  useImperativeHandle(ref, () => ({

    toggleExpansion() {
      setExpanded(prevExpanded => !prevExpanded);
      console.log("the menu is expanded:", expanded);
    }

  }));

  useEffect(() => {
      console.log("triggered");
      console.log("a link is active: ", props.editor.isActive("link"));
      console.log("the menu is expanded:", expanded);
      if(!expanded && props.editor.isActive("link")) {
        console.log(props.editor.getAttributes("link").href);
        setUrl(props.editor.getAttributes("link").href)
      } else if(!expanded && !props.editor.isActive("link")){
        setUrl("");
      }
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log("submitted");
    props.editor.chain().focus().setLink({ href: url }).run()
    setUrl("");
  }

  const handleChange = (e: any) => {
    setUrl(e.target.value);
    console.log("changed to ", url);
  }

  return (
    <div className={`link-menu`}>
      <form onSubmit={handleSubmit}>
        <IconContext.Provider value={{ className: "link-icon" }}>
          <div className={'link-icon-container'} >
            <AiOutlineLink />
          </div>
        </IconContext.Provider>
        <input className={'input-field'} type="text" value={url} onChange={handleChange}/>
        <input className={'submit-button'} type="submit" value=">"/>
      </form>
    </div>
  );
});

export default LinkForm;