import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef } from "react";
import PluginResource from "../../store/PluginResource";
import EngineWithOutput from "../../typecellEngine/EngineWithOutput";
import NotebookCell from "../notebook/NotebookCell";

type Props = {
  plugin: PluginResource;
};

const PluginRenderer: React.FC<Props> = observer((props) => {
  const disposer = useRef<() => void>();

  const engine = useMemo(() => {
    if (disposer.current) {
      disposer.current();
      disposer.current = undefined;
    }
    const newEngine = new EngineWithOutput(props.plugin.id);
    disposer.current = () => {
      newEngine.dispose();
    };
    return newEngine;
  }, [props.plugin.id]);

  useEffect(() => {
    return () => {
      if (disposer.current) {
        disposer.current();
        disposer.current = undefined;
      }
    };
  }, []);

  // renderLogger.log("cellList");
  return (
    <div className="cellLidst">
      {/* TODO: should execute in a separate sandbox? */}
      <NotebookCell
        cell={props.plugin.pluginCell}
        engine={engine}
        awareness={props.plugin.webrtcProvider.awareness}
      />
    </div>
  );
});

export default PluginRenderer;
