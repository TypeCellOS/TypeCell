import { NavigateFunction } from "react-router-dom";

export const navigateRef: { current: NavigateFunction | undefined } = {
  current: undefined,
};

export function setNavigateRef(navigate: NavigateFunction) {
  navigateRef.current = navigate;
}
