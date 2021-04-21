import { observer } from "mobx-react-lite";
import * as React from "react";
import { useEffect, useState } from "react";
import { getModel, releaseModel } from "../../models/modelCache";
import { BaseResource } from "../../store/BaseResource";

import { DocConnection } from "../../store/DocConnection";
import { runtimeStore } from "../../store/local/runtimeStore";

import EngineWithOutput from "../../typecellEngine/EngineWithOutput";
import RetryErrorBoundary from "../notebook/RetryErrorBoundary";

// TODO: should this be a React component or raw JS?

type Props = {
  document: BaseResource;
};

/**
 * The custom renderer uses the code by a parent document to render a view.
 * e.g.: if DocumentA.type === "DocumentB", we use DocumentB as a renderer
 */
export const CustomRenderer = observer((props: Props) => {
  if (!props.document.type || props.document.type.startsWith("!")) {
    throw new Error("don't expect built-in document as renderer here");
  }
  const [rendererDocument, setRendererDocument] = useState<BaseResource>();
  const [engine, setEngine] = useState<EngineWithOutput>();

  const renderer = runtimeStore.customRenderers.get(props.document.type);

  useEffect(() => {
    if (!renderer) {
      return;
    }
    const loader = DocConnection.load(renderer.rendererId);
    setRendererDocument(loader);
    return () => {
      loader.dispose();
    };
  }, [renderer]);

  // TODO: also useMemo to get engine, instead of useEffect?
  useEffect(() => {
    if (!rendererDocument?.doc) {
      return;
    }

    const newEngine = new EngineWithOutput(rendererDocument.id);
    setEngine(newEngine);

    const cells = rendererDocument.doc.cells;
    cells.forEach((c) => {
      const model = getModel(c);
      newEngine.engine.registerModel(model);
    });

    return () => {
      cells.forEach((c) => releaseModel(c));
      newEngine.dispose();
    };
  }, [
    rendererDocument?.id,
    rendererDocument?.doc,
    rendererDocument?.doc?.cells,
  ]); // TODO: does this create a new engine every time the doc changes?

  if (!renderer) {
    return <div>No renderer for this type found</div>;
  }
  if (!rendererDocument || !engine || !rendererDocument.doc) {
    return <div>Loading</div>;
  }

  if (rendererDocument.doc.type !== "!notebook") {
    // return <div>Invalid document type {props.document.type} {rendererDocument.type}</div>
    throw new Error("only notebook documents supported");
  }

  const layoutObject =
    engine.engine.observableContext.context[renderer.variable];

  if (!layoutObject) {
    return <div>Invalid renderer for this type</div>;
  }

  return (
    <RetryErrorBoundary>
      <div>{layoutObject}</div>
    </RetryErrorBoundary>
  );
});
