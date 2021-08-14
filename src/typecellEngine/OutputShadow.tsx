import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "react";

export const OutputShadow = observer(
  (props: {
    dimensions: { width: number; height: number };
    positions: { x: number; y: number };
    onMouseMove: () => void;
  }) => {
    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const updatePositions = () => {
        if (!divRef.current) {
          return;
        }
        const bbox = divRef.current.getBoundingClientRect();
        runInAction(() => {
          props.positions.x = bbox.x;
          props.positions.y = bbox.y;
        });
      };
      const handle = setInterval(updatePositions, 20); // TODO: replace with MutationObserver?
      return () => {
        clearInterval(handle);
      };
    }, [props.positions]);

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
