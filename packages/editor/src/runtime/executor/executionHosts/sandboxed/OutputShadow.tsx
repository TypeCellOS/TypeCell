import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";

export const OutputShadow = observer(
  (props: {
    dimensions: { width: number; height: number };
    positions: { x: number; y: number };
    positionOffsetElement: HTMLElement;
    onMouseMove: () => void;
  }) => {
    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const updatePositions = () => {
        if (!divRef.current) {
          return;
        }
        const parentBB = props.positionOffsetElement.getBoundingClientRect();
        let { y, x } = divRef.current.getBoundingClientRect();
        y -= parentBB.y;
        x -= parentBB.x;
        runInAction(() => {
          if (props.positions.x !== x || props.positions.y !== y) {
            console.log("update pos", y, props.positions.y);
            props.positions.x = x;
            props.positions.y = y;
          }
        });
      };
      const handle = setInterval(updatePositions, 20); // TODO: replace with MutationObserver?
      return () => {
        clearInterval(handle);
      };
    }, [props.positions, props.positionOffsetElement]);

    return (
      <div
        onMouseMove={props.onMouseMove}
        style={{
          width: props.dimensions.width,
          height: props.dimensions.height,
          maxWidth: "100%",
        }}
        ref={divRef}></div>
    );
  }
);

export default OutputShadow;
