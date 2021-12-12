import type SocketEvents from "@shared/SocketEvents";
import express from "express";
import http from "http";
import { loadConfiguration, startServer } from "snowpack";
import { Server } from "socket.io";

const app = express();
const httpServer = http.createServer(app);
const io = new Server<SocketEvents>(httpServer, { serveClient: false });

(async () => {
    const snowpackConfig = await loadConfiguration({
        mode: "development",
        devOptions: {
            // Don't start a HTTP server for Snowpack
            port: 0,
            hmr: true,
        },
    });
    const snowpackServer = await startServer({ config: snowpackConfig });

    app.use(async (req, res, next) => {
        try {
            const buildResult = await snowpackServer.loadUrl(req.url);
            if (buildResult) {
                if (buildResult.contentType)
                    res.contentType(buildResult.contentType);
                res.status(200).send(buildResult.contents);
            }
        } catch (err) {
            next(err);
        }
    });

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

    httpServer.listen(8080, () => {
        console.log("App listening on http://localhost:8080");
    });
})();
