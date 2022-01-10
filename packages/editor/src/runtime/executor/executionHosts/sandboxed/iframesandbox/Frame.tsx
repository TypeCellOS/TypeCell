import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "react";
import Output from "../../../components/Output";
import { FrameConnection } from "./FrameConnection";
import "./Frame.css";

// global connection to parent window
let frameConnection: FrameConnection | undefined;

function getFrameConnection() {
  if (!frameConnection) {
    frameConnection = new FrameConnection();
  }
  return frameConnection;
}

export const Frame = observer((props: {}) => {
  const connection = getFrameConnection();

  const resizeObserver = useRef(
    new ResizeObserver((entries) => {
      for (let entry of entries) {
        const path = entry.target.getAttribute("data-path");
        if (!path) {
          throw new Error("unexpected");
        }
        if (entry.borderBoxSize) {
          const borderBoxSize = Array.isArray(entry.borderBoxSize)
            ? entry.borderBoxSize[0]
            : entry.borderBoxSize;

          connection.setDimensions(path, {
            width: borderBoxSize.inlineSize,
            height: borderBoxSize.blockSize,
          });
        } else {
          connection.setDimensions(path, {
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    })
  );

  function setRef(div: HTMLDivElement | null) {
    if (!div) {
      return;
    }
    resizeObserver.current.observe(div);
    // TODO: currently we never unobserve
  }

  // This is triggered when the mouse moves over the iframe, but not over an output area (because we use stopPropagation below).
  // Trigger mouseLeave and hand over capture area to the parent window.
  const onMouseLeaveContainer = useCallback(() => {
    connection.mouseLeave();
  }, [connection]);

  // When the mouse hovers an output element, stopPropagation so onMouseLeaveContainer doesn't get called
  const onMouseMoveOutput = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
    },
    []
  );

  // disposer
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      resizeObserver.current.disconnect();
    };
  }, []);

  /*
  Test scenarios:
  - Cell works well with overflow: export let x = <div style={{ width: "100px" }}>hello</div>;
  - Outer cell div must be exactly same as OutputShadow div, so hovering over output vs code must change pointerEvents correctly (see IframeEngine)
  */
  return (
    <div
      style={containerStyle}
      className="fullSize"
      onMouseMove={onMouseLeaveContainer}>
      {Array.from(connection.modelPositions.entries())
        .sort((entryA, entryB) => entryA[1].y - entryB[1].y)
        .map(([id, positions]) => {
          return (
            <div
              ref={setRef}
              key={id}
              data-path={id}
              style={getOutputOuterStyle(positions.x, positions.y)}
              onMouseMove={onMouseMoveOutput}>
              <div style={outputInnerStyle}>
                <Output modelPath={id} outputs={connection.outputs} />
              </div>
            </div>
          );
        })}
    </div>
  );
});

// TODO: does this cause unnecessary renders?
const getOutputOuterStyle = (x: number, y: number) => ({
  left: x,
  top: y,
  position: "absolute" as "absolute",
  padding: 0,
  width: "100%",
});

const outputInnerStyle = {
  maxWidth: "100%",
  width: "100%",
};

const containerStyle = { position: "relative" as "relative" };

export default Frame;
