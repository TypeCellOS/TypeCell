import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import { observer } from "mobx-react-lite";
import { useContext } from "react";
import { VscFile, VscGithub, VscGlobe } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import { FileIdentifier } from "../../../../identifiers/FileIdentifier";
import { GithubIdentifier } from "../../../../identifiers/GithubIdentifier";
import { HttpsIdentifier } from "../../../../identifiers/HttpsIdentifier";
import { Identifier } from "../../../../identifiers/Identifier";
import { identifiersToPath } from "../../../../identifiers/paths/identifierPathHelpers";
import { DocConnection } from "../../../../store/DocConnection";
import ProfileResource from "../../../../store/ProfileResource";
import { SessionStore } from "../../../../store/local/SessionStore";
import { RouteContext } from "../../../routes/RouteContext";

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

function getTitleForIdentifier(
  identifier: Identifier,
  sessionStore: SessionStore
) {
  const doc = DocConnection.get(identifier, sessionStore);
  if (doc) {
    switch (doc.tryDoc?.type) {
      case "!project":
        // TODO
        return "public workspace";
      case "!profile":
        return doc.tryDoc!.getSpecificType(ProfileResource).title;
      case "!notebook":
      case "!document":
        return doc.tryDoc!.doc.title || "Untitled";
      default:
        return "…";
    }
  }
  return "…";
}

const BreadcrumbItems = observer((props: { sessionStore: SessionStore }) => {
  const items: JSX.Element[] = [];
  const navigate = useNavigate();

  const { groups } = useContext(RouteContext);

  groups.forEach((identifiers) => {
    const lastIdentifier = identifiers[identifiers.length - 1];

    identifiers.forEach((identifier, i) => {
      let component: any;

      // if (i === identifiers.length - 1) {
      //   component = () => (
      //     // Replace default component so it doesn't render as a link
      //     <button style={{ ...buttonStyle, cursor: "normal" }}>
      //       <span>{identifier.toString()}</span>
      //     </button>
      //   );
      // }
      let icon;
      if (i === 0) {
        if (identifier instanceof HttpsIdentifier) {
          icon = <VscGlobe style={{ marginRight: 5 }} />;
        } else if (identifier instanceof FileIdentifier) {
          icon = <VscFile style={{ marginRight: 5, marginTop: -2 }} />;
        } else if (identifier instanceof GithubIdentifier) {
          icon = <VscGithub style={{ marginRight: 5 }} />;
        }
      }

      const path = "/" + identifiersToPath(identifiers.slice(0, i + 1));
      items.push(
        <BreadcrumbsItem
          iconBefore={icon}
          text={getTitleForIdentifier(identifier, props.sessionStore)}
          component={component}
          href={path}
          onClick={(e) => {
            e.preventDefault();
            navigate(path);
          }}
        />
      );
    });
  });

  return <>{[...items]}</>;
});

export const Breadcrumb = (props: { sessionStore: SessionStore }) => {
  return (
    <Breadcrumbs>
      <BreadcrumbItems sessionStore={props.sessionStore} />
    </Breadcrumbs>
  );
};
