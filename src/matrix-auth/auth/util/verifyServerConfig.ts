import AutoDiscoveryUtils, {
  ValidatedServerConfig,
} from "./AutoDiscoveryUtils";
import { AutoDiscovery } from "matrix-js-sdk";
// from
export async function verifyServerConfig(config: any) {
  let validatedConfig: ValidatedServerConfig;
  try {
    console.log("Verifying homeserver configuration");

    // Note: the query string may include is_url and hs_url - we only respect these in the
    // context of email validation. Because we don't respect them otherwise, we do not need
    // to parse or consider them here.

    // Note: Although we throw all 3 possible configuration options through a .well-known-style
    // verification, we do not care if the servers are online at this point. We do moderately
    // care if they are syntactically correct though, so we shove them through the .well-known
    // validators for that purpose.

    // const config = SdkConfig.get();
    let wkConfig = config["default_server_config"]; // overwritten later under some conditions
    const serverName = config["default_server_name"];
    const hsUrl = config["default_hs_url"];
    const isUrl = config["default_is_url"];

    const incompatibleOptions = [wkConfig, serverName, hsUrl].filter(
      (i) => !!i
    );
    if (incompatibleOptions.length > 1) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(
        "Invalid configuration: can only specify one of default_server_config, default_server_name, " +
          "or default_hs_url."
      );
    }
    if (incompatibleOptions.length < 1) {
      // noinspection ExceptionCaughtLocallyJS
      throw Error("Invalid configuration: no default server specified.");
    }

    if (hsUrl) {
      console.log(
        "Config uses a default_hs_url - constructing a default_server_config using this information"
      );
      console.warn(
        "DEPRECATED CONFIG OPTION: In the future, default_hs_url will not be accepted. Please use " +
          "default_server_config instead."
      );

      wkConfig = {
        "m.homeserver": {
          base_url: hsUrl,
        },
      };
      if (isUrl) {
        wkConfig["m.identity_server"] = {
          base_url: isUrl,
        };
      }
    }

    let discoveryResult = null;
    if (wkConfig) {
      console.log("Config uses a default_server_config - validating object");
      discoveryResult = await AutoDiscovery.fromDiscoveryConfig(wkConfig);
      //   throw new Error("not supported");
    }

    if (serverName) {
      console.log(
        "Config uses a default_server_name - doing .well-known lookup"
      );
      console.warn(
        "DEPRECATED CONFIG OPTION: In the future, default_server_name will not be accepted. Please " +
          "use default_server_config instead."
      );
      discoveryResult = await AutoDiscovery.findClientConfig(serverName);
      //   throw new Error("not supported");
    }

    validatedConfig = AutoDiscoveryUtils.buildValidatedConfigFromDiscovery(
      serverName,
      discoveryResult,
      true
    );
  } catch (e) {
    /*
    const { hsUrl, isUrl, userId } = await Lifecycle.getStoredSessionVars();
    if (hsUrl && userId) {
      console.error(e);
      console.warn(
        "A session was found - suppressing config error and using the session's homeserver"
      );

      console.log("Using pre-existing hsUrl and isUrl: ", { hsUrl, isUrl });
      validatedConfig =
        await AutoDiscoveryUtils.validateServerConfigWithStaticUrls(
          hsUrl,
          isUrl,
          true
        );
    } else {*/
    // the user is not logged in, so scream
    throw e;
    // }
  }

  validatedConfig.isDefault = true;

  // Just in case we ever have to debug this
  console.log("Using homeserver config:", validatedConfig);

  // Add the newly built config to the actual config for use by the app
  console.log("Updating SdkConfig with validated discovery information");
  //   SdkConfig.add({ validated_server_config: validatedConfig });

  return validatedConfig; //SdkConfig.get();
}
