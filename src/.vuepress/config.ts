import { defineUserConfig } from "vuepress";

import theme from "./theme.js";
import { gitPlugin } from "@vuepress/plugin-git";
import { commentPlugin } from '@vuepress/plugin-comment'

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "overthestep",
  description: "跨过阶梯去感受无边界的世界吧",

  theme,

  // 和 PWA 一起启用
  // shouldPrefetch: false,
  plugins: [
    gitPlugin({
      createdTime: false,
      updatedTime: true,      // 是否启用 “最后更新时间”
      contributors: false,     // 是否启用 “贡献者” 信息
    }),
     commentPlugin({
      provider: 'Giscus',
      repo:'zero7cola/overthestep',
      repoId: 'R_kgDOQPrYjA',
      category: 'Announcements',
      categoryId: 'DIC_kwDOQPrYjM4Cxfcs'
      // 其他选项
      // ...
    }),
  ],
});
