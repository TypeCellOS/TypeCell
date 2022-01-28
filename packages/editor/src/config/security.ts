import { ENVIRONMENT } from "./config";

/*
Helper functions to ensure we're loading the application (host) and user-code frame (sandbox) from the correct domains

DEV:
- Application must load from localhost:xxxx, and sandbox from 127.0.0.1:xxxx
  This ensures a different hostname / browser security sandbox

STAGING:
 on staging (vercel branch preview) we use the same hostname to load the iframe
 note that this is unsafe as it will allow eval'ed code to access cookies on the host
 Ideally, we'd use a different staging domain, or a wildcard subdomain (but vercel doesn't support this for previews)

PROD:
  On prod, sandbox is loaded from typescriptrepl.com, and the host is loaded from notebooks.typecell.org
  Prod is deployed to both domains

 */
export function validateHostDomain() {
  const hostname = window.location.hostname;

  if (ENVIRONMENT === "DEV") {
    return hostname === "localhost";
  }

  if (ENVIRONMENT === "STAGING") {
    return hostname.match(/^typecell-next-[A-z0-9-]+-yousefed.vercel.app$/);
  }
  return hostname === "notebooks.typecell.org";
}

export function validateFrameDomain() {
  const hostname = window.location.hostname;

  if (ENVIRONMENT === "DEV") {
    return hostname === "127.0.0.1";
  }

  if (ENVIRONMENT === "STAGING") {
    return hostname.match(/^typecell-next-[A-z0-9-]+-yousefed.vercel.app$/);
  }
  return hostname.match(/^.*\.typescriptrepl\.com$/);
}

export function getFrameDomain() {
  if (ENVIRONMENT === "DEV") {
    const port = window.location.host.match(/^localhost:(\d+)$/)![1];
    return "127.0.0.1:" + port;
  }

  if (ENVIRONMENT === "STAGING") {
    return window.location.hostname;
  }
  // TODO: now cookies / localstorage are still shared across notebooks. Should we use a unique subdomain per user or notebook?
  return "code.typescriptrepl.com";
}

export function getMainDomainFromIframe() {
  if (ENVIRONMENT === "DEV") {
    const port = window.location.host.match(/^127\.0\.0\.1:(\d+)$/)![1];
    return "localhost:" + port;
  }

  if (ENVIRONMENT === "STAGING") {
    return window.location.hostname;
  }
  return "notebooks.typecell.org";
}
