import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import { observer } from "mobx-react-lite";
import { VscFile, VscGithub, VscGlobe } from "react-icons/vsc";
import { FileIdentifier } from "../../../../identifiers/FileIdentifier";
import { GithubIdentifier } from "../../../../identifiers/GithubIdentifier";
import { HttpsIdentifier } from "../../../../identifiers/HttpsIdentifier";
import { MatrixIdentifier } from "../../../../identifiers/MatrixIdentifier";
import { NavigationStore } from "../../../../store/local/navigationStore";
import { getStoreService } from "../../../../store/local/stores";

const getBreadcrumbItems = function (navigationStore: NavigationStore) {
  const { identifier } = navigationStore.currentDocument!;
  const items: JSX.Element[] = [];

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

  function clearSubPath() {
    identifier.subPath = "";
  }

  if (identifier instanceof FileIdentifier) {
    // Show path as single item
    items.push(
      <BreadcrumbsItem
        iconBefore={<VscFile style={{ marginRight: 5, marginTop: -2 }} />}
        text={identifier.title || identifier.uri.toString()}
        onClick={clearSubPath}
      />
    );
  } else if (identifier instanceof GithubIdentifier) {
    // Show path as single item
    items.push(
      <BreadcrumbsItem
        iconBefore={<VscGithub style={{ marginRight: 5 }} />}
        href=""
        onClick={clearSubPath}
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
        onClick={clearSubPath}
      />
    );
  } else if (identifier instanceof MatrixIdentifier) {
    items.push(
      <BreadcrumbsItem
        href=""
        text={identifier.owner}
        onClick={() => {
          navigationStore.showProfilePage(identifier.owner);
        }}
      />,
      <BreadcrumbsItem
        text={identifier.document}
        component={() => (
          // Replace default component so it doesn't render as a link
          <button style={{ ...buttonStyle, cursor: "normal" }}>
            <span>{identifier.document}</span>
          </button>
        )}
      />
    );
  } else {
    throw new Error("unsupported identifier");
  }

  if (identifier.subPath) {
    const parts = identifier.subPath.split("/");
    const subItems: JSX.Element[] = [];
    while (parts.length) {
      const link = parts.join("/");
      const part = parts.pop()!;
      subItems.push(
        <BreadcrumbsItem
          text={part}
          href=""
          onClick={() => {
            identifier.subPath = link;
          }}
        />
      );
    }
    subItems.reverse();
    items.push.apply(items, subItems);
  }

  return items;
};

export const Breadcrumb: React.FC<{}> = observer(() => {
  const navigationStore = getStoreService().navigationStore;

  return <Breadcrumbs>{getBreadcrumbItems(navigationStore)}</Breadcrumbs>;
});
