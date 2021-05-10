import React from "react";

// an object of event handlers for SideMenu component
const menuOptionsHandlers = {
  // this event handler finds the parent node and deletes the block
  onDelete: (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    console.log(`menu option clicked`);
    let block = event.currentTarget;
    if (block) {
      for (let i = 0; i < 8; i++) {
        // @ts-ignore
        block = block.parentNode;
      }
      block.remove();
    }
  },
};

export default menuOptionsHandlers;
