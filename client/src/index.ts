import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";

ReactDOM.render(React.createElement(App, null), document.getElementById("app"));

// (map.dragRotate as any)._mousePitch.disablko();
// map.addControl(new mapboxgl.NavigationControl());

// Patch import.meta
declare global {
    interface ImportMeta {
        env: {
            MODE: "development" | "production";
            NODE_ENV: "development" | "production";
            SSR: boolean;

            SNOWPACK_PUBLIC_ACCESS_TOKEN: string;
        };
    }
}
