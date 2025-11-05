import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "overthestep",
  description: "跨过阶梯去感受无边界的世界吧",

  theme,

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
