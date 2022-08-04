import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import { VscFile, VscGithub, VscGlobe } from "react-icons/vsc";
import { useNavigate, useOutletContext } from "react-router-dom";
import { path } from "vscode-lib";
import { FileIdentifier } from "../../../../identifiers/FileIdentifier";
import { GithubIdentifier } from "../../../../identifiers/GithubIdentifier";
import { HttpsIdentifier } from "../../../../identifiers/HttpsIdentifier";
import { Identifier } from "../../../../identifiers/Identifier";
import { MatrixIdentifier } from "../../../../identifiers/MatrixIdentifier";
import { toProfilePage } from "../../../routes/routes";

const buttonStyle = {
  alignItems: "baseline",
  borderWidth: 0,
  display: "inline-flex",
  maxWidth: "100%",
  textDecoration: "none",
  background: "none",
  height: "auto",
  lineHeight: "inherit",
  padding: 0,
  verticalAlign: "baseline",
  width: "auto",
  justifyContent: "center",
  fontWeight: 400,
  minWidth: 0,
};

const BreadcrumbItems = (props: { identifier: Identifier }) => {
  const items: JSX.Element[] = [];
  const navigate = useNavigate();
  const identifier = props.identifier;

  const toRoot = () => {
    if (identifier.title === "Docs") {
      navigate({
        pathname: "/docs",
      });
    } else {
      navigate({
        pathname: "/" + identifier.toString(),
      });
    }
  };

  if (identifier instanceof FileIdentifier) {
    // Show path as single item
    items.push(
      <BreadcrumbsItem
        iconBefore={<VscFile style={{ marginRight: 5, marginTop: -2 }} />}
        text={identifier.title || identifier.uri.toString()}
        onClick={toRoot}
      />
    );
  } else if (identifier instanceof GithubIdentifier) {
    // Show path as single item
    items.push(
      <BreadcrumbsItem
        iconBefore={<VscGithub style={{ marginRight: 5 }} />}
        href=""
        onClick={toRoot}
        text={identifier.title || identifier.uri.toString()}
      />
    );
  } else if (identifier instanceof HttpsIdentifier) {
    // Show path as single item
    items.push(
      <BreadcrumbsItem
        iconBefore={<VscGlobe style={{ marginRight: 5 }} />}
        href=""
        text={identifier.title || identifier.uri.toString()}
        onClick={toRoot}
      />
    );
  } else if (identifier instanceof MatrixIdentifier) {
    items.push(
      <BreadcrumbsItem
        key={identifier.owner}
        href=""
        text={identifier.owner}
        onClick={() => {
          navigate(toProfilePage(identifier.owner));
        }}
      />,
      <BreadcrumbsItem
        key={identifier.document}
        text={identifier.document}
        component={() => (
          // Replace default component so it doesn't render as a link
          <button style={{ ...buttonStyle, cursor: "normal" }}>
            <span>{identifier.document}</span>
          </button>
        )}
      />
    );
  }

  return <>{[...items]}</>;
};

export const Breadcrumb = (props: { identifier: Identifier }) => {
  const parentId = (useOutletContext() as any)?.parentIdentifier as
    | Identifier
    | undefined;
  const navigate = useNavigate();

  if (parentId) {
    let parentPart = parentId.toString();
    if (parentPart.endsWith("index.json")) {
      // TODO: hacky to fix here, this is for the http loader
      parentPart = parentPart.substring(
        0,
        parentPart.length - "index.json".length
      );
    }
    if (!props.identifier.toString().startsWith(parentPart)) {
      throw new Error("unexpected parent identifier");
    }

    const subOnly = props.identifier.toString().substring(parentPart.length);

    const parts = subOnly.split("/");
    const subItems: JSX.Element[] = [];
    while (parts.length) {
      const link =
        parentId.title === "Docs"
          ? path.join("/docs", ...parts)
          : "/" + path.join(parentPart, ":", ...parts);

      const part = parts.pop()!;
      if (part.length) {
        subItems.push(
          <BreadcrumbsItem
            key={link}
            text={part}
            href=""
            onClick={(e) => {
              navigate({ pathname: link });
              e.preventDefault();
            }}
          />
        );
      }
    }
    subItems.reverse();
    return (
      <Breadcrumbs>
        {parentId && <BreadcrumbItems identifier={parentId} />}
        {[...subItems]}
      </Breadcrumbs>
    );
  }

  return (
    <Breadcrumbs>
      <BreadcrumbItems identifier={props.identifier} />
    </Breadcrumbs>
  );
};
