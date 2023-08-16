import styles from "./OutputWrapper.module.css";

export function OutputWrapper(props: { children: React.ReactNode }) {
  return <span className={styles.outputWrapper}>{props.children}</span>;
}
