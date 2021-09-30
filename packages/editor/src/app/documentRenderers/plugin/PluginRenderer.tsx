import { observer } from "mobx-react-lite";
import React from "react";
// import { getEngineForPlugin } from "../../../pluginEngine/pluginSystem.ts.bak";
import PluginResource from "../../../store/PluginResource";

type Props = {
  plugin: PluginResource;
};

const PluginRenderer: React.FC<Props> = observer((props) => {
  // const engine = getEngineForPlugin(props.plugin);

  // renderLogger.log("cellList");
  return (
    <div className="cellList">
      {/* TODO: should execute in a separate sandbox? */}
      {/* <NotebookCell
        cell={props.plugin.pluginCell}
        executionHost={engine}
        awareness={props.plugin.webrtcProvider?.awareness}
      /> */}
      Not implemented
    </div>
  );
});

export default PluginRenderer;
