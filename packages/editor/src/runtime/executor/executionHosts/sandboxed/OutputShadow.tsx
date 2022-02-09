import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";

/**
 * The OutputShadow is a "fake" empty div which the SandboxedExecutionHost renders
 * in the position of the cell output.
 * However, the actual cell output is rendered by the Iframe (iframe/Frame.tsx).
 *
 * The dimensions of the OutputShadow are passed in from the iframe (via the bridge),
 *  so the iframe knows where to render the actual output.
 *
 * The position of the OutputShadow are passed to the iframe over the bridge (by the host).
 */
export const OutputShadow = observer(
  (props: {
    dimensions: { width: number; height: number };
    positions: { x: number; y: number };
    positionOffsetElement: HTMLElement;
    onMouseMove: () => void;
  }) => {
    const divRef = useRef<HTMLDivElement>(null);

    // Monitor the position of the OutputShadow so we can pass
    // updates to the iframe. The iframe then knows at which x, y position
    // it needs to render the output
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
      // We use setInterval to monitor the positions.
      // TODO: can we use MutationObserver or something else for this?
      const handle = setInterval(updatePositions, 20);
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
