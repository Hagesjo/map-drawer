// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    plugins: [
        "@snowpack/plugin-sass",
        "@snowpack/plugin-postcss",
        "@snowpack/plugin-dotenv",
        /* ... */
    ],
    packageOptions: {
        /* ... */
    },
    devOptions: {
        tailwindConfig: "./tailwind.config.js",
    },
    buildOptions: {
        /* ... */
    },

    mount: {
        src: "/dist",
        public: {
            url: "/",
            static: true,
        },
    },
};
