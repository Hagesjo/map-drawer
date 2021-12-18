// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

import proxy from "http2-proxy";
import { logger } from "snowpack";

/** @type {import("snowpack").SnowpackUserConfig } */
export default {
    workspaceRoot: "../",
    plugins: [
        "@snowpack/plugin-postcss",
        "@snowpack/plugin-typescript",
        "@snowpack/plugin-dotenv",
    ],
    devOptions: {
        tailwindConfig: "./tailwind.config.js",
    },
    packageOptions: {
        knownEntrypoints: ["deep-diff", "rfdc", "eventemitter3"],
        polyfillNode: true,
    },
    buildOptions: {
        cacheDirPath: "../node_modules/.cache/snowpack",
    },
    mount: {
        src: "/dist",
        public: {
            url: "/",
            static: true,
        },
    },
    routes: [
        {
            src: "/socket.io/.*",
            dest: (req, res) => {
                return proxy.web(
                    req,
                    res,
                    {
                        hostname: "localhost",
                        port: 8081,
                    },
                    (err) => {
                        if (err) {
                            logger.error(`[DEST] ${err.name}: ${err.message}`, {
                                name: "socket.io/proxy",
                            });
                        }
                    }
                );
            },
            upgrade: (req, socket, head) => {
                proxy.ws(
                    req,
                    socket,
                    head,
                    {
                        hostname: "localhost",
                        port: 8081,
                    },
                    (err, req, socket) => {
                        if (err) {
                            logger.error(
                                `[UPGRADE] ${err.name}: ${err.message}`,
                                {
                                    name: "socket.io/proxy",
                                }
                            );
                            socket.destroy();
                        }
                    }
                );
            },
        },
    ],
};
