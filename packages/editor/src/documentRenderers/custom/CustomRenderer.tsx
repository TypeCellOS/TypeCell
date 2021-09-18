import { observer } from "mobx-react-lite";
import * as React from "react";
import { useEffect, useState } from "react";
import { Engine, CodeModel } from "@typecell-org/engine";
import { getTypeCellCodeModel } from "../../models/TypeCellCodeModel";
import { BaseResource } from "../../store/BaseResource";
import { DocConnection } from "../../store/DocConnection";
import { runtimeStore } from "../../store/local/runtimeStore";
import { getTypeCellResolver } from "../../typecellEngine/resolver";
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
  const [rendererDocument, setRendererDocument] = useState<DocConnection>();
  const [engine, setEngine] = useState<Engine<CodeModel>>();

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
    if (!rendererDocument?.tryDoc) {
      return;
    }

    const newEngine = new Engine(
      () => {},
      () => {},
      getTypeCellResolver(rendererDocument.identifier.toString(), "CR", false) // TODO: add unique id for cachekey?
    );
    setEngine(newEngine);

    const cells = rendererDocument.tryDoc.doc.cells;
    const models = cells.map((c) => getTypeCellCodeModel(c));
    models.forEach((m) => {
      newEngine.registerModel(m.object);
    });

    return () => {
      models.forEach((m) => m.dispose());
      newEngine.dispose();
    };
  }, [
    rendererDocument?.identifier,
    rendererDocument?.tryDoc,
    rendererDocument?.tryDoc?.doc.cells,
  ]); // TODO: does this create a new engine every time the doc changes?

  if (!renderer) {
    return <div>No renderer for this type found</div>;
  }
  if (!rendererDocument || !engine || rendererDocument.doc === "loading") {
    return <div>Loading</div>;
  }

  if (rendererDocument.doc === "not-found") {
    return <div>Not found</div>;
  }

  if (rendererDocument.doc.type !== "!notebook") {
    // return <div>Invalid document type {props.document.type} {rendererDocument.type}</div>
    throw new Error("only notebook documents supported");
  }

  const layoutObject = engine.observableContext.context[renderer.variable];

  if (!layoutObject) {
    return <div>Invalid renderer for this type</div>;
  }

  return (
    <RetryErrorBoundary>
      <div>{layoutObject}</div>
    </RetryErrorBoundary>
  );
});
