import { ClientEvents, ServerEvents } from "@map-drawer/shared";
import io, { Socket } from "socket.io-client";

const socket: Socket<ServerEvents, ClientEvents> = io();

socket.io.engine.on("upgrade", (transport) => {
    console.log("upgrade", transport);
});
socket.io.engine.on("upgradeError", (err) => {
    console.log("upgradeError", err);
});
socket.io.engine.on("upgrading", (transport) => {
    console.log("upgrading", transport);
});

socket.on("connect", () => {
    console.log("connect", socket.id);
});
socket.on("connect_error", (err) => {
    console.log("connect_error", err);
});
socket.on("disconnect", (reason) => {
    console.log("disconnect", reason);
});

const serverListener: ServerEvents = {
    "hello world": (payload, cb) => {
        alert(payload);
        cb(1337);
    },
    initState: (state) => {},
    updateState: (diffs) => {},
};
socket.onAny((event: string, ...args: any[]) => {
    if (event in serverListener)
        // @ts-ignore(2556)
        serverListener[event as keyof typeof serverListener](...args);
    else console.warn("L337 h4xx0rz trying to send bad event", event);
});

export default socket;
