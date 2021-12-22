import Breadcrumbs, { BreadcrumbsItem } from "@atlaskit/breadcrumbs";
import { observer } from "mobx-react-lite";
import { FileIdentifier } from "../../../../identifiers/FileIdentifier";
import { GithubIdentifier } from "../../../../identifiers/GithubIdentifier";
import { HttpsIdentifier } from "../../../../identifiers/HttpsIdentifier";
import { MatrixIdentifier } from "../../../../identifiers/MatrixIdentifier";
import { NavigationStore } from "../../../../store/local/navigationStore";
import { getStoreService } from "../../../../store/local/stores";

const getBreadcrumbItems = function (navigationStore: NavigationStore) {
  const { identifier } = navigationStore.currentDocument!;
  const { path } = identifier.uri;

  if (
    identifier instanceof FileIdentifier ||
    identifier instanceof GithubIdentifier ||
    identifier instanceof HttpsIdentifier
  ) {
    // Show path as single item
    return (
      <BreadcrumbsItem
        text={path} // Replace default component so it doesn't render as a link
        component={() => <span>{path}</span>}
      />
    );
  } else if (identifier instanceof MatrixIdentifier) {
    return (
      <>
        <BreadcrumbsItem
          href=""
          text={identifier.owner}
          onClick={() => {
            navigationStore.showProfilePage(identifier.owner);
          }}
        />
        <BreadcrumbsItem
          text={identifier.document}
          // Replace default component so it doesn't render as a link
          component={() => <span>{identifier.document}</span>}
        />
      </>
    );
  }
};

export const Breadcrumb: React.FC<{}> = observer((props) => {
  const navigationStore = getStoreService().navigationStore;

  return <Breadcrumbs>{getBreadcrumbItems(navigationStore)}</Breadcrumbs>;
});
