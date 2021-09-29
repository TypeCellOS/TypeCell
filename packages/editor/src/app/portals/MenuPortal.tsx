import { observable } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { arrays } from "vscode-lib";
import { getStoreService } from "../../store/local/stores";

/**
 * This portal works via Mobx instead of using normal React Portals.
 * Normal React Portals have the disadvantage that they render directly into the DOM.
 * This means we always have a wrapping DOM element. This doesn't interact nicely with atlaskit menus,
 * as we want inserted DropDown Items to be direct children of the menu
 */
export const MenuPortal = observer((props: { children: any }) => {
  const parent = useRef({
    children: observable([] as any[], { deep: false }),
  });

  useEffect(() => {
    const navigationStore = getStoreService().navigationStore;
    navigationStore.menuPortalChildren.push(parent.current!);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      arrays.remove(navigationStore.menuPortalChildren, parent.current!);
    };
  }, []);
  // if (!navigationStore.menuPortalHost) {
  //   return null;
  // }
  // return ReactDOM.createPortal(props.children, navigationStore.menuPortalHost);
  parent.current.children = props.children;
  console.log("assign children");
  return null;
});
