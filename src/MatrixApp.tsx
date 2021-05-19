import UAParser from "ua-parser-js";

import * as sdk from "matrix-js-sdk";
import LoginComponent from "./auth/Login";
import { ValidatedServerConfig } from "./auth/util/AutoDiscoveryUtils";

// Parse the given window.location and return parameters that can be used when calling
// MatrixChat.showScreen(screen, params)
function getScreenFromLocation(location: Location) {
  // const fragparts = parseQsFromFragment(location);
  // return {
  //     screen: fragparts.location.substring(1),
  //     params: fragparts.params,
  // };
  return {
    screen: "UNIMPLEMENTED",
    params: "UNIMPLEMENTED",
  };
}

const client = sdk.createClient("https://matrix.org");
// client.publicRooms(function (err: any, data: any) {
//   console.log("Public Rooms: %s", JSON.stringify(data));
// });

// client.getRoomIdForAlias(
//   "#yousefed:matrix.org",
//   function (err: any, data: any) {
//     console.log("user Rooms: %s", JSON.stringify(data));
//   }
// );

// This will be called whenever the SDK changes screens,
// so a web page can update the URL bar appropriately.
function onNewScreen(screen: string, replaceLast = false) {
  console.log("newscreen " + screen);
  // const hash = '#/' + screen;
  // lastLocationHashSet = hash;

  // if (replaceLast) {
  //     window.location.replace(hash);
  // } else {
  //     window.location.assign(hash);
  // }
}

// Here, we do some crude URL analysis to allow
// deep-linking.
// function routeUrl(location: Location) {
//     if (!window.matrixChat) return;

//     console.log("Routing URL ", location.href);
//     const s = getScreenFromLocation(location);
//     (window.matrixChat as MatrixChatType).showScreen(s.screen, s.params);
// }

// function onHashChange(ev: HashChangeEvent) {
//     if (decodeURIComponent(window.location.hash) === lastLocationHashSet) {
//         // we just set this: no need to route it!
//         return;
//     }
//     routeUrl(window.location);
// }

function makeRegistrationUrl(params: object) {
  console.log("reg url");
}

function onTokenLoginCompleted() {
  // if we did a token login, we're now left with the token, hs and is
  // url as query params in the url; a little nasty but let's redirect to
  // clear them.
  const url = new URL(window.location.href);

  url.searchParams.delete("loginToken");

  console.log(`Redirecting to ${url.href} to drop loginToken from queryparams`);
  window.history.replaceState(null, "", url.href);
}

function getDefaultDeviceDisplayName() {
  const ua = new UAParser();
  const browserName = ua.getBrowser().name || "unknown browser";
  let osName = ua.getOS().name || "unknown OS";
  // Stylise the value from the parser to match Apple's current branding.
  if (osName === "Mac OS") osName = "macOS";

  return `TypeCell (${browserName}, ${osName})`;
}

export default function MatrixApp(props: { config: ValidatedServerConfig }) {
  // XXX: the way we pass the path to the worker script from webpack via html in body's dataset is a hack
  // but alternatives seem to require changing the interface to passing Workers to js-sdk
  const vectorIndexeddbWorkerScript =
    document.body.dataset.vectorIndexeddbWorkerScript;
  if (!vectorIndexeddbWorkerScript) {
    // If this is missing, something has probably gone wrong with
    // the bundling. The js-sdk will just fall back to accessing
    // indexeddb directly with no worker script, but we want to
    // make sure the indexeddb script is present, so fail hard.
    // throw newTranslatableError(_td("Missing indexeddb worker script!"));
  }
  // MatrixClientPeg.setIndexedDbWorkerScript(vectorIndexeddbWorkerScript);

  //   window.addEventListener("hashchange", onHashChange);

  // const platform = sdk.PlatformPeg.get();

  // const params = parseQs(window.location);

  const urlWithoutQuery =
    window.location.protocol +
    "//" +
    window.location.host +
    window.location.pathname;
  console.log("Vector starting at " + urlWithoutQuery);

  //   // Before we continue, let's see if we're supposed to do an SSO redirect
  //   const [userId] = await Lifecycle.getStoredSessionOwner();
  //   const hasPossibleToken = !!userId;
  //   const isReturningFromSso = !!params.loginToken;
  //   const autoRedirect = config["sso_immediate_redirect"] === true;
  //   if (!hasPossibleToken && !isReturningFromSso && autoRedirect) {
  //     console.log("Bypassing app load to redirect to SSO");
  //     const tempCli = createClient({
  //       baseUrl: config["validated_server_config"].hsUrl,
  //       idBaseUrl: config["validated_server_config"].isUrl,
  //     });
  //     PlatformPeg.get().startSingleSignOn(
  //       tempCli,
  //       "sso",
  //       `/${getScreenFromLocation(window.location).screen}`
  //     );

  //     // We return here because startSingleSignOn() will asynchronously redirect us. We don't
  //     // care to wait for it, and don't want to show any UI while we wait (not even half a welcome
  //     // page). As such, just don't even bother loading the MatrixChat component.
  //     return;
  //   }

  function sendMessage() {
    const content = {
      body: "message text",
      msgtype: "m.text",
    };
    client.createRoom(
      {
        room_alias_name: "test1234",
        visibility: "private",
        name: "test1234",
        topic: "",
      },
      (err: any, res: any) => {
        console.log(err);
      }
    );
    // client.sendEvent(
    //   "@yousefed:matrix.org",
    //   "m.room.message",
    //   content,
    //   "",
    //   (err: any, res: any) => {
    //     console.log(err);
    //   }
    // );
  }
  // const MatrixChat = sdk.getComponent("structures.MatrixChat");
  return (
    <div>
      <LoginComponent
        serverConfig={props.config}
        onLoggedIn={() => {
          console.log("logged in");
        }}
        onRegisterClick={() => {
          console.log("register");
        }}
        onServerConfigChange={() => {
          console.log("config change");
        }}
      />
      {/* <button onClick={sendMessage}>click</button> */}
    </div>
  );
}
