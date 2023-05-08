import DefaultTheme from "vitepress/theme";

// import "./scripts/edit-link";

import "./styles/index.scss";

export default {
  ...DefaultTheme,
  enhanceApp(ctx: any) {
    DefaultTheme.enhanceApp(ctx);
  },
};
