import React from "react";

export const HoverTrackerContext = React.createContext({
  setHover: (hover: boolean) => {},
});
