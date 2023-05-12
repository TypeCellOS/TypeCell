import { NavigateFunction } from "react-router-dom";

export let navigateRef: { current: NavigateFunction | undefined } = {
  current: undefined,
};

export function setNavigateRef(navigate: NavigateFunction) {
  navigateRef.current = navigate;
}
