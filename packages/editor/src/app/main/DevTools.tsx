import Select from "@atlaskit/select";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Inspector } from "react-inspector";
import { Rnd } from "react-rnd";
import { DocConnection } from "../../store/DocConnection";
import { SessionStore } from "../../store/local/SessionStore";
import { DocumentInfo } from "../../store/yjs-sync/DocumentCoordinator";
import { TypeCellRemote } from "../../store/yjs-sync/remote/TypeCellRemote";
import styles from "./DevTools.module.css";

export const DevTools = observer((props: { sessionStore: SessionStore }) => {
  const [offline, setOffline] = useState(false);
  const [flaky, setFlaky] = useState(false);
  const flakyInterval = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  useEffect(() => {
    TypeCellRemote.Offline = offline;
  }, [offline]);

  useEffect(() => {
    clearInterval(flakyInterval.current);
    if (flaky) {
      flakyInterval.current = setInterval(() => {
        setOffline((o) => !o);
      }, 5000);
    }
  }, [flaky]);

  const [selectedResource, setSelectedResource] = useState<
    string | undefined
  >();

  const [onlyLoaded, setOnlyLoaded] = useState(true);

  if (!props.sessionStore.documentCoordinator) {
    return <div>Loading</div>;
  }

  let documentCoordinatorEntries = [
    ...(props.sessionStore.documentCoordinator.documents.entries() as IterableIterator<
      [string, DocumentInfo]
    >),
  ].map(([key, value]) => {
    const resource = DocConnection.get(key, props.sessionStore);
    return {
      // id: key,
      ...value,
      loaded: props.sessionStore.documentCoordinator?.loadedDocuments.has(key),
      created_at: new Date(value.created_at),
      needs_save_since: value.needs_save_since
        ? new Date(value.needs_save_since)
        : undefined,
      type: resource?.tryDoc?.type,
      title:
        resource?.tryDoc?.type === "!richtext"
          ? resource?.tryDoc.doc.title
          : resource?.tryDoc?.title,
    };
  });

  if (onlyLoaded) {
    documentCoordinatorEntries = documentCoordinatorEntries.filter(
      (d) => d.loaded,
    );
  }

  const selectOptions = documentCoordinatorEntries
    .filter((d) => d.loaded)
    .map((d) => ({
      label: d.title + " (" + d.id + ")",
      value: d.id,
    }));
  // const resourceEntries = [...cache.entries()].map(([key, value]) => {
  //   return {
  //     id: key,
  //     identifier: value.identifier.toString(),
  //     type: value.tryDoc?.type,
  //     title: value.tryDoc?.title,
  //     ydoc: JSON.stringify(value.tryDoc?.ydoc.toJSON()),
  //   };
  // });

  const ydoc = selectedResource
    ? DocConnection.get(
        selectedResource,
        props.sessionStore,
      )?.tryDoc?.ydoc.toJSON()
    : undefined;

  return (
    <Rnd
      style={{ zIndex: 19999000 }}
      default={{
        x: 50,
        y: 50,
        width: window.innerWidth - 100,
        height: window.innerHeight - 100,
      }}
      dragHandleClassName={styles.header}>
      <div className={styles.devtools}>
        <div className={styles.header}>DevTools</div>
        <div className={styles.content}>
          <h1>Network</h1>
          <label>
            <input
              type="checkbox"
              onChange={(e) => {
                setFlaky(false);
                setOffline(e.target.checked);
              }}
              checked={offline}
            />{" "}
            Offline
          </label>
          <label>
            <input
              type="checkbox"
              onChange={(e) => setFlaky(e.target.checked)}
              checked={flaky}
            />{" "}
            Flaky (offline / online every 5s)
          </label>
          <h1>Documents</h1>
          <div className={styles.tableContainer}>
            <label>
              <input
                type="checkbox"
                onChange={(e) => setOnlyLoaded(e.target.checked)}
                checked={onlyLoaded}
              />{" "}
              Only show loaded
            </label>
            <Inspector
              className="test"
              table={true}
              data={documentCoordinatorEntries}
            />
          </div>
          <h1>Resources</h1>
          <div className={styles.selectContainer}>
            <Select
              // cacheOptions
              // onChange={onChange}
              // loadOptions={searchUsers}
              // menuPosition="fixed"
              backspaceRemovesValue
              isClearable
              placeholder="Select resource…"
              onChange={(v) => setSelectedResource(v?.value)}
              options={selectOptions}
            />
          </div>
          {selectedResource && <Inspector table={false} data={ydoc} />}
        </div>
      </div>
    </Rnd>
  );
});
