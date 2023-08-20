import styles from "./CardContainer.module.css";

export const CardContainer = (props: { children: React.ReactNode }) => {
  return <div className={styles.cardContainer}>{props.children}</div>;
};
