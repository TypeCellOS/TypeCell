import { useCallback } from "react";

export function ContainedElement(
  props: {
    element: HTMLElement;
  } & React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >
) {
  const { element, ...containerProps } = props;
  const setRef = useCallback(
    (container: HTMLElement | null) => {
      if (container) {
        container.innerHTML = "";
        container.appendChild(props.element);
      }
    },
    [props.element]
  );

  return (
    <div style={{ display: "contents" }} ref={setRef} {...containerProps}></div>
  );
}
