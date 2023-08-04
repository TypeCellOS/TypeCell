import { IframeBridgeMethods, ModelForwarder } from "@typecell-org/frame";
import { ContainedElement } from "@typecell-org/util";
import { AsyncMethodReturns, connectToChild } from "penpal";
import { useMemo } from "react";
import { parseIdentifier } from "../../../identifiers";
import { DocumentResourceModelProvider } from "../../../store/DocumentResourceModelProvider";
import { SessionStore } from "../../../store/local/SessionStore";

export function FrameHost(props: { url: string; sessionStore: SessionStore }) {
  const frame: HTMLIFrameElement = useMemo(() => {
    /**
     * Penpal postmessage connection methods exposed by the iframe
     */
    let connectionMethods: AsyncMethodReturns<IframeBridgeMethods> | undefined;

    const moduleManagers = new Map<
      string,
      { provider: DocumentResourceModelProvider; forwarder: ModelForwarder }
    >();

    const methods = {
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
          props.sessionStore
        );

        const forwarder = new ModelForwarder(
          "modules/" + moduleName,
          provider,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          connectionMethods!
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
    iframe.className = "fullSize";
    iframe.sandbox.add(
      "allow-same-origin",
      "allow-scripts",
      "allow-downloads",
      "allow-popups",
      "allow-modals",
      "allow-forms",
      "allow-popups-to-escape-sandbox",
      "allow-top-navigation-by-user-activation"
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
    connection.promise.then((methods) => {
      connectionMethods = methods;
    });
    return iframe;
  }, [props.url, props.sessionStore]);

  return (
    <>
      {/* <FlagComponent /> */}
      <ContainedElement element={frame} />
    </>
  );
}
