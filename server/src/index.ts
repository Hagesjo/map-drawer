import type ClientEvents from "@shared/ClientEvents";
import type ServerEvents from "@shared/ServerEvents";
import type WithSockets from "@shared/WithSockets";
import express from "express";
import type { Feature } from "geojson";
import http from "http";
import { Server, Socket } from "socket.io";

const app = express();
const httpServer = http.createServer(app);
const io = new Server<ClientEvents, ServerEvents>(httpServer, {
    serveClient: false,
});

const FEATURES = new Map<String, Feature>();

const clientListener: WithSockets<Socket, ClientEvents> = {
    "draw.create": (socket, features) => {
        console.log("draw.create", features);
        features.forEach((feature) =>
            FEATURES.set(feature.id as string, feature)
        );
        io.except(socket.id).emit("features", Array.from(FEATURES.values()));
    },
    "draw.delete": (socket, ids) => {
        console.log("draw.delete", ids);
        ids.forEach((id) => FEATURES.delete(id));
        io.except(socket.id).emit("features", Array.from(FEATURES.values()));
    },
};

io.on("connection", (socket) => {
    console.log("connection", socket.id);

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
