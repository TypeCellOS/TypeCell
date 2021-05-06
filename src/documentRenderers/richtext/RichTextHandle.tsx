import { observer } from "mobx-react-lite";

import styles from "./RichTextRenderer.module.css";

type HandleProps = {
  id: string;
};
/**
 * This Component is used inside a RichTextEditor for the side menu display
 */
const Handle: React.FC<HandleProps> = observer((props) => {
  return (
    <div
      className={`${styles["handle"]}`}
      onClick={(event) => {
        console.log(`clicking a handle...`);
        // @ts-ignore
        const handle: any = event.nativeEvent.target;
        const menu = document.querySelector(`#${props.id} > div`);
        // @ts-ignore
        const display = menu.style.display;
        if (menu && display === "none") {
          const rect = handle.getBoundingClientRect();
          // @ts-ignore
          menu.style.left = `${-999}px`;
          // @ts-ignore
          menu.style.display = "block";
          // @ts-ignore
          menu.style.left = `calc(${rect.left - menu.scrollWidth}px - 2em)`;
          // @ts-ignore
          menu.style.top = `${
            window.pageYOffset +
            (rect.top + rect.bottom) / 2 -
            menu.scrollHeight / 2
          }px`;
        } else {
          // @ts-ignore
          menu.style.display = "none";
        }
      }}>
      &nbsp;⁞&nbsp;
    </div>
  );
});

export default Handle;
