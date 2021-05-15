import React, { useState } from "react";
import { AiOutlineLink } from 'react-icons/ai';
import { IconContext } from "react-icons";

import "./LinkForm.css";

const LinkForm: React.FC = (props) => {

  const [url, setUrl] = useState("");

  const handleSubmit = (e: any) => {
    console.log("submitted");
    e.preventDefault();
  }

  const handleChange = (e: any) => {
    console.log("changed");
    setUrl(e.target.value);
  }

  return (
    <div className={`link-menu`}>
      <form onSubmit={handleSubmit}>
        <IconContext.Provider value={{ className: "link-icon" }}>
          <div className={'link-icon-container'} >
            <AiOutlineLink />
          </div>
        </IconContext.Provider>
        <input className={'input-field'} type="text" onChange={handleChange}/>
        <input className={'submit-button'} type="submit" value=">"/>
      </form>
    </div>
  );
}

export default LinkForm;