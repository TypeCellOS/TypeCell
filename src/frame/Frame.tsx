import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import Output from "../documentRenderers/notebook/Output";
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

  function onMouseLeave(id: string) {
    connection.mouseLeave(id);
  }
  // disposer
  useEffect(() => {
    return () => {
      resizeObserver.current.disconnect();
    };
  }, []);

  /*
  Test scenarios:
  - Cell works well with overflow: export let x = <div style={{ width: "100px" }}>hello</div>;
  - Outer cell div must be exactly same as OutputShadow div, so hovering over output vs code must change pointerEvents correctly (see IframeEngine)
  */
  return (
    <div style={{ position: "relative" }} className="fullSize">
      {Array.from(connection.outputs.keys())
        .sort((keyA, keyB) => keyA.positions.y - keyB.positions.y)
        .map((key) => {
          return (
            <div
              ref={setRef}
              key={key.path}
              data-path={key.path}
              style={{
                left: key.positions.x,
                top: key.positions.y,
                position: "absolute",
                padding: "10px",
                width: "100%",
              }}
              onMouseLeave={() => {
                onMouseLeave(key.path);
              }}>
              <div
                style={{
                  maxWidth: "100%",
                  width: "100%",
                  overflowX: "auto",
                }}>
                <Output model={key} outputs={connection.outputs} />
              </div>
            </div>
          );
        })}
    </div>
  );
});

export default Frame;
