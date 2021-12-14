import type {
    ClientEvents,
    ServerEvents,
    SharedState,
    WithSockets,
} from "@map-drawer/shared";
import { stateUpdater } from "@map-drawer/shared";
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";

const app = express();
const httpServer = http.createServer(app);
const io = new Server<ClientEvents, ServerEvents>(httpServer, {
    serveClient: false,
});

const updateAndEmit = (except: string | string[]) => {
    const diffs = stateUpdater.update();
    if (diffs !== undefined && diffs.length > 0)
        io.except(except).emit("updateState", diffs);
};

const clientListener: WithSockets<Socket, ClientEvents> = {
    "draw.create": (socket, features) => {
        console.log("draw.create", features);
        stateUpdater.addFeatures(features);
        updateAndEmit(socket.id);
    },
    "draw.delete": (socket, ids) => {
        console.log("draw.delete", ids);
        stateUpdater.removeFeatures(ids);
        updateAndEmit(socket.id);
    },
};

io.on("connection", (socket) => {
    console.log("connection", socket.id);
    socket.emit("initState", stateUpdater.state() as SharedState);

    socket.on("disconnect", (reason) => {
        console.log("disconnect", reason);
    });

    socket.onAny((event: string, ...args: any[]) => {
        if (event in clientListener) {
            // @ts-ignore(2556)
            clientListener[event as keyof typeof clientListener](
                socket,
                ...args
            );
        } else console.warn("L337 h4xx0rz trying to send bad event", event);
    });
});

httpServer.listen(8081, () => {
    console.log("Server listening on http://localhost:8081");
});
