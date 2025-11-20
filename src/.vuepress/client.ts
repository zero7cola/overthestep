import { defineClientConfig  } from "vuepress/client";

import Accounting from "./components/Accounting.vue";

export default defineClientConfig({
    enhance: ({ app, router, siteData }) => {
        app.component("Accounting", Accounting);
    },
});
