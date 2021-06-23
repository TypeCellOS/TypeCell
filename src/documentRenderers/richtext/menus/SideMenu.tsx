import styles from "./SideMenu.module.css";
import { MenuGroup, ButtonItem } from "@atlaskit/menu";

type Props = {
  onDelete: () => void;
};

/**
 * A side menu is created for each block for block level functionalities.
 * It will be wrapped in a Tippy instance, whose triggerTarget is the drag handle of this block.
 * @param props none;
 * @returns React.FC
 */
const SideMenu = (props: Props) => {
  return (
    <div className={styles.menuList}>
      <MenuGroup>
        <ButtonItem onClick={props.onDelete}>Delete</ButtonItem>
        <ButtonItem isDisabled={true}>Item 2</ButtonItem>
      </MenuGroup>
    </div>
  );
};

export default SideMenu;
