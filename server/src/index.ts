import type SocketEvents from "@shared/SocketEvents";
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = http.createServer(app);
const io = new Server<SocketEvents>(httpServer, { serveClient: false });

io.on("connection", (socket) => {
    console.log("connection", socket.id);

    socket.on("disconnect", (reason) => {
        console.log("disconnect", reason);
    });

    setTimeout(() => {
        socket.emit("hello world", "alert message!!", (n) => {
            console.log("cb", n);
        });
    }, 1000);
});

httpServer.listen(8081, () => {
    console.log("Server listening on http://localhost:8081");
});
