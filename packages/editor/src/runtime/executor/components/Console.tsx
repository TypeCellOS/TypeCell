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

  return <ConsoleComponent logs={output} variant="light" />;
});

export default Console;
