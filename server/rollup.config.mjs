import typescript from "@rollup/plugin-typescript";
import { createRequire } from "module";
import cleaner from "rollup-plugin-cleaner";

const require = createRequire(import.meta.url);
const { dependencies } = require("../package.json");

export default {
    input: "src/index.ts",
    output: {
        file: "build/index.js",
        format: "cjs",
        sourcemap: true,
    },
    external: Object.keys(dependencies).concat("http"),
    plugins: [
        cleaner({ targets: ["build"] }),
        typescript({ module: "ESNext" }),
    ],
};
