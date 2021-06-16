import Tippy from "@tippyjs/react";
import Button from "@atlaskit/button";
import Remove from "remixicon-react/LinkUnlinkIcon";
import Open from "remixicon-react/ExternalLinkFillIcon";
import menuStyles from "../../../menus/InlineMenu.module.css";
import styles from "../Hyperlink.module.css";

type HyperlinkMenuProps = {
  href: string;
  removeHandler: () => void;
};

/**
 * A hyperlink menu shown when an anchor is hovered over.
 * @param props props of a hyperlink menu
 * @returns a menu for editing/removing/opening the link
 */
export const HyperlinkBasicMenu = (props: HyperlinkMenuProps) => {
  return (
    <div className={`${styles.linkerWrapper} ${menuStyles.bubbleMenu}`}>
      <Tippy
        content={
          <div className={menuStyles.buttonTooltip}>
            <div className={menuStyles.mainText}>Edit</div>
          </div>
        }>
        <Button appearance="subtle" className="hyperlinkEdit">
          Edit Link
        </Button>
      </Tippy>

      <Button appearance="subtle" className={styles.separator}></Button>

      <Tippy
        content={
          <div className={menuStyles.buttonTooltip}>
            <div className={menuStyles.mainText}>Open in new tab</div>
          </div>
        }>
        <Button
          style={{ width: "36px" }}
          appearance="subtle"
          onClick={() => {
            window.open("//" + props.href, "_blank");
          }}
          iconBefore={<Open className={menuStyles.icon}></Open>}></Button>
      </Tippy>

      <Button appearance="subtle" className={styles.separator}></Button>

      <Tippy
        content={
          <div className={menuStyles.buttonTooltip}>
            <div className={menuStyles.mainText}>Remove link</div>
          </div>
        }>
        <Button
          style={{ width: "36px" }}
          appearance="subtle"
          onClick={props.removeHandler}
          iconBefore={<Remove className={menuStyles.icon}></Remove>}></Button>
      </Tippy>
    </div>
  );
};
