import styles from "./Card.module.css";

export const Card = (props: {
  title: string;
  body: string;
  onClick: () => void;
  selected: boolean;
}) => {
  return (
    <div
      className={`${styles.card} ${props.selected ? styles.selected : ""}`}
      onClick={props.onClick}>
      <h2>{props.title}</h2>
      <div>{props.body}</div>
    </div>
  );
};
