import styles from "./CardContainer.module.css";

export const CardContainer = (props: { children: any }) => {
  return <div className={styles.cardContainer}>{props.children}</div>;
};
