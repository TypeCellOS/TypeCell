import React from "react";

import "./LinkField.css";

const LinkField: React.FC = (props) => {
  return (
    <div className={`link-menu`}>
      <form>
        <input type="text" value="Enter URL"/>
        <input type="submit" value=">"/>
      </form>
    </div>
  );
}

export default LinkField;