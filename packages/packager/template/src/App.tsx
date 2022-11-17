import Output from "./components/Output";
import * as notebook from "./notebook";

const nb = notebook.getNotebook();

function App() {
  const cellOutputs = nb.modules.map((mod) => {
    return <Output modelPath={mod.name} outputs={nb.outputs} key={mod.name} />;
  });

  return <>{cellOutputs}</>;
}

export default App;
