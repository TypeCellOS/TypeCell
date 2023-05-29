import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useRef } from "react";
import Output from "../../../components/Output";
import "./Frame.css";
import { FrameConnection } from "./FrameConnection";

// The sandbox frame where end-user code gets evaluated.
// It is loaded from index.iframe.ts

// global connection to parent window
let frameConnection: FrameConnection | undefined;

function getFrameConnection() {
  if (!frameConnection) {
    frameConnection = new FrameConnection();
  }
  return frameConnection;
}

/*
  Test scenarios:
  - Cell works well with overflow: export let x = <div style={{ width: "100px" }}>hello</div>;
  - Outer cell div must be exactly same as OutputShadow div, so hovering over output vs code must change pointerEvents correctly (see IframeEngine)
  */

export const Frame = observer((props: {}) => {
  const connection = getFrameConnection();

  /**
   * The resizeObserver keeps track of the dimensions of all cell Output divs.
   * The dimensions are forwarded to the host, so it can use it the resize the "fake" OutputShadow
   * divs accordingly
   */
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
            width: entry.contentRect.left + entry.contentRect.right,
            height: entry.contentRect.top + entry.contentRect.bottom,
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

  // When the mouse hovers an output element,
  // call stopPropagation so onMouseLeaveContainer doesn't get called
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

  // The only content in the iframe is a
  // list of <Output> components for every cell registered on the frameConnection
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
  padding: "10px",
  width: "100%",
});

const outputInnerStyle = {
  maxWidth: "100%",
  width: "100%",
};

const containerStyle = { position: "relative" as "relative" };

export default Frame;
