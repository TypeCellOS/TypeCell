import React, { useState } from "react";

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
        <input type="text" onChange={handleChange}/>
        <input type="submit" value=">"/>
      </form>
    </div>
  );
}

export default LinkForm;