import { IframeBridgeMethods } from "@typecell-org/shared";
import { ContainedElement, useResource } from "@typecell-org/util";
import { PenPalProvider } from "@typecell-org/y-penpal";
import { AsyncMethodReturns, connectToChild } from "penpal";
import { useRef } from "react";
import * as awarenessProtocol from "y-protocols/awareness";
import { parseIdentifier } from "../../../identifiers";
import { DocumentResource } from "../../../store/DocumentResource";
import { DocumentResourceModelProvider } from "../../../store/DocumentResourceModelProvider";
import { SessionStore } from "../../../store/local/SessionStore";
import { ModelForwarder } from "./ModelForwarder";

export function FrameHost(props: {
  url: string;
  sessionStore: SessionStore;
  document: DocumentResource;
}) {
  /**
   * Penpal postmessage connection methods exposed by the iframe
   */
  const connectionMethods = useRef<AsyncMethodReturns<IframeBridgeMethods>>();

  const frame = useResource(() => {
    const provider = new PenPalProvider(
      props.document.ydoc,
      (buf, provider) => {
        connectionMethods.current?.processYjsMessage(buf);
      },
      props.document.awareness,
    );
    const frameClientIds = new Set<number>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props.document.awareness?.on("change", (changes: any, origin: any) => {
      if (origin !== provider) {
        return;
      }
      if (changes.added.length === 0) {
        return;
      }
      changes.added.forEach((client: number) => {
        frameClientIds.add(client);
      });
    });
    provider.connect();

    const removePresence = () => {
      // remove cursor from awareness when we navigate away
      console.log("remove awareness");
      if (props.document.awareness) {
        console.log("remove awareness 2");
        awarenessProtocol.removeAwarenessStates(
          props.document.awareness,
          [...frameClientIds],
          "window unload",
        );
      }
    };

    window.addEventListener("beforeunload", removePresence);

    const moduleManagers = new Map<
      string,
      { provider: DocumentResourceModelProvider; forwarder: ModelForwarder }
    >();

    const methods = {
      processYjsMessage: async (message: ArrayBuffer) => {
        provider.onMessage(message, "penpal");
      },
      registerTypeCellModuleCompiler: async (moduleName: string) => {
        if (moduleManagers.has(moduleName)) {
          console.warn("already has moduleManager for", moduleName);
          return;
        }
        if (!moduleName.startsWith("!")) {
          throw new Error("invalid module name");
        }
        const identifierStr = moduleName.substring(1);
        const identifier = parseIdentifier(identifierStr);
        const provider = new DocumentResourceModelProvider(
          identifier,
          props.sessionStore,
        );

        const forwarder = new ModelForwarder(
          "modules/" + moduleName,
          provider,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          connectionMethods.current!,
        );
        moduleManagers.set(moduleName, { provider, forwarder });
        await forwarder.initialize();
        return identifier.toString();
      },
      unregisterTypeCellModuleCompiler: async (moduleName: string) => {
        const moduleManager = moduleManagers.get(moduleName);
        if (!moduleManager) {
          console.warn("no moduleManager for", moduleName);
          return;
        }
        moduleManager.provider.dispose();
        moduleManager.forwarder.dispose();
        moduleManagers.delete(moduleName);
      },
    };

    const iframe = document.createElement("iframe");
    // iframe.style.position = "absolute";
    // iframe.style.width = "100%";
    // iframe.style.height = "100%";
    // iframe.style.pointerEvents = "all";
    iframe.style.border = "none";
    iframe.style.flex = "1 1";
    iframe.className = "fullSize";
    iframe.sandbox.add(
      "allow-same-origin",
      "allow-scripts",
      "allow-downloads",
      "allow-popups",
      "allow-modals",
      "allow-forms",
      "allow-popups-to-escape-sandbox",
      "allow-top-navigation-by-user-activation",
    );
    iframe.allow =
      "geolocation; microphone; camera; midi; encrypted-media; autoplay; accelerometer; magnetometer; gyroscope";
    iframe.allowFullscreen = true;
    iframe.src = props.url;

    const connection = connectToChild<IframeBridgeMethods>({
      // The iframe to which a connection should be made
      iframe: iframe,
      // Methods the parent is exposing to the child
      methods: methods,
    });
    console.info("parent window connecting to iframe");
    connection.promise.then(
      (methods) => {
        console.info("connected to iframe succesfully");
        connectionMethods.current = methods;
        // connect
      },
      (e) => {
        console.error("connection to iframe failed", e);
      },
    );

    return [
      iframe,
      () => {
        connectionMethods.current = undefined;
        window.removeEventListener("beforeunload", removePresence);
        provider.disconnect();
        provider.destroy();
        removePresence();

        connection.destroy();
      },
    ];
  }, [props.url, props.sessionStore, props.document]);

  return (
    <>
      {/* <FlagComponent /> */}
      <ContainedElement element={frame} />
    </>
  );
}
