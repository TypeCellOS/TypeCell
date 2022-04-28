import { ObservableMap } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { ConsoleOutput } from "./ConsoleOutput";
import { Console as ConsoleComponent } from "console-feed";

type Props = {
  modelPath: string;
  outputs: ObservableMap<string, ConsoleOutput>;
};

const Console: React.FC<Props> = observer((props) => {
  const consoleOutput = props.outputs.get(props.modelPath);

  let output = (consoleOutput?.events || []).map((event, i) => {
    return {
      id: i.toString(),
      data: event.arguments,
      method: event.level,
    };
  });

  // Return blank in case there are no console events
  if (!output.length) {
    return <></>;
  }

  return (
    <>
      <div style={consoleStyle}>
        <ConsoleComponent
          styles={{
            LOG_AMOUNT_COLOR: "white",
            // Somehow unable to change the amount background color. Line below doesn't work
            LOG_INFO_AMOUNT_BACKROUND: "#0060ff",
          }}
          logs={output}
          variant="light"
        />
      </div>
      <div style={{ minHeight: "100px" }}></div>
    </>
  );
});

const consoleStyle = {
  borderLeft: "1px solid #eeeeee",
  width: "40%",
  maxHeight: "100%",
  height: "100%",
  overflow: "auto",
  display: "flex",
  "flex-direction": "column-reverse",
  position: "absolute" as "absolute",
  bottom: "-1px",
  right: "0",
  backgroundColor: "white",
};

export default Console;
