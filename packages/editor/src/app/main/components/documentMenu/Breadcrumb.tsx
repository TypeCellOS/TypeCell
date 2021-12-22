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

  if (identifier instanceof FileIdentifier) {
    debugger;
    // Show path as single item
    items.push(
      <BreadcrumbsItem
        iconBefore={<VscFile style={{ marginRight: 5, marginTop: -2 }} />}
        text={identifier.title || identifier.uri.toString()}
        onClick={() => (identifier.subPath = "")}
      />
    );
  } else if (identifier instanceof GithubIdentifier) {
    // Show path as single item
    items.push(
      <BreadcrumbsItem
        iconBefore={<VscGithub style={{ marginRight: 5 }} />}
        href=""
        onClick={() => (identifier.subPath = "")}
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
        onClick={() => (identifier.subPath = "")}
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
        // Replace default component so it doesn't render as a link
        component={() => <span>{identifier.document}</span>}
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

export const Breadcrumb: React.FC<{}> = observer((props) => {
  const navigationStore = getStoreService().navigationStore;

  return <Breadcrumbs>{getBreadcrumbItems(navigationStore)}</Breadcrumbs>;
});
