import React from "react";
import ReactDOM from "react-dom";
import io from "socket.io-client";
import App from "./components/App";

ReactDOM.render(React.createElement(App, null), document.getElementById("app"));

const socket = io();
socket.on("connect", () => {
    console.log("connect", socket.id);
});
socket.on("connect_error", (err) => {
    console.log("connect_error", err);
});
socket.on("disconnect", (reason) => {
    console.log("disconnect", reason);
});

// (map.dragRotate as any)._mousePitch.disablko();
// map.addControl(new mapboxgl.NavigationControl());
