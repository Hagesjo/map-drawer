import type { SharedState } from "@map-drawer/shared";
import { stateUpdater } from "@map-drawer/shared";
import WorldMapboxDraw, { DrawActionableEvent, DrawCombineEvent, DrawCreateEvent, DrawDeleteEvent, DrawEventType, DrawModeChageEvent, DrawRenderEvent, DrawSelectionChangeEvent, DrawUncombineEvent, DrawUpdateEvent } from "@mapbox/mapbox-gl-draw";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import mapboxgl, { MapboxGeoJSONFeature } from "mapbox-gl";
import React, { useEffect, useRef } from "react";
import DragCircleMode from "../modes/DragCircle";
import RadiusMode from "../modes/RadiusMode";
import socket from "../socket";
import CoordinateGeocoder from "./CoordinateGeocoder";
import { useMapContext } from "./MapContext";

// @ts-ignore
mapboxgl.accessToken = import.meta.env.SNOWPACK_PUBLIC_ACCESS_TOKEN;

interface WorldMapProps {
    mapStyle: string;
    shouldDraw: boolean;
}

type DrawEvents = {
    "draw.create": DrawCreateEvent;
    "draw.delete": DrawDeleteEvent;
    "draw.update": DrawUpdateEvent;
    "draw.render": DrawRenderEvent;
    "draw.combine": DrawCombineEvent;
    "draw.uncombine": DrawUncombineEvent;
    "draw.modechange": DrawModeChageEvent;
    "draw.actionable": DrawActionableEvent;
    "draw.selectionchange": DrawSelectionChangeEvent;
};

interface DrawMap {
    on<T extends DrawEventType>(
        type: T,
        listener: (e: DrawEvents[T]) => void
    ): void;
}

const modifyingDrawEvents: ReadonlyArray<DrawEventType> = [
    "draw.create",
    "draw.delete",
    "draw.combine",
    "draw.uncombine",
];

export default function WorldMap({ mapStyle, shouldDraw }: WorldMapProps) {
    const { mapState, initMapState, setDrawFeatures, setSelectedDrawFeatures } =
        useMapContext();
    const container = useRef<HTMLDivElement>(null);
    let timeoutID: NodeJS.Timeout

    useEffect(() => {
        if (!container.current || mapState !== null) return;
        const map = new mapboxgl.Map({
            container: container.current, // container ID
            style: mapStyle, // style URL
            // center: [11.970231148670322, 57.69103126724703], // starting position [lng, lat]
            center: [-122.486052, 37.830348],
            zoom: 12, // starting zoom
        }) as DrawMap & mapboxgl.Map;

        const flyto = map.flyTo.bind(map);
        map.flyTo = (
            options: mapboxgl.FlyToOptions,
            eventData?: mapboxgl.EventData
        ) => {
            options.speed = (options.speed ?? 1.2) * 3;
            flyto(options, eventData);
            return map;
        };

        const draw = new WorldMapboxDraw({
            displayControlsDefault: false,
            // Select which mapbox-gl-draw control buttons to add to the map.
            controls: {
                polygon: true,
                line_string: true,
                trash: true,
            },
            userProperties: true,
            modes: {
                ...WorldMapboxDraw.modes,
                drag_circle: DragCircleMode,
                radius_circle: RadiusMode,
                // drag_circle: DragCircleMode,
                // direct_select: DirectMode,
                // simple_select: SimpleSelectMode,
            },
            // Set mapbox-gl-draw to draw by default.
            // The user does not have to click the polygon control button first.
            defaultMode: "radius_circle",
        });
        map.on("mousemove", (e) => {
            // very temporary lab, should reactify this
            const features = map.queryRenderedFeatures(e.point)
            let currentDrawing: MapboxGeoJSONFeature | undefined;
            features.forEach(f => {
                if (f.layer.id.includes("gl-draw-polygon-stroke")) {
                    currentDrawing = f;
                }
            });
            if (currentDrawing !== undefined) {
                let measure = document.querySelector("#donthatemeraffe") as any;
                measure.style.visibility = "visible";
                measure.style.left = e.originalEvent.clientX + "px";
                measure.style.top = e.originalEvent.clientY + 10 + "px";
                let km = document.querySelector("#measure-km") as any;
                let miles = document.querySelector("#measure-miles") as any;
                if (currentDrawing.layer.id.includes("cold")) {
                    km.innerText = (currentDrawing as any).properties.user_radius_km + " km";
                    miles.innerText = (currentDrawing as any).properties.user_radius_miles + " miles";
                } else {
                    km.innerText = (currentDrawing as any).properties.radius_km + " km";
                    miles.innerText = (currentDrawing as any).properties.radius_miles + " miles";
                }
            } else {
                let measure = document.querySelector("#donthatemeraffe") as any;
                clearTimeout(timeoutID)
                timeoutID = setTimeout(() => {measure.style.visibility = "hidden"}, 2000);
            }
        })

        map.on("load", () => {
            draw.set({
                type: "FeatureCollection",
                features: Object.values(
                    stateUpdater.state().features as SharedState["features"]
                ),
            });
            initMapState({
                map,
                draw,
                drawFeatures: new Map(
                    draw
                        .getAll()
                        .features.map((feature) => [
                            feature.id as string,
                            feature,
                        ])
                ),
                selectedDrawFeatures: new Set(draw.getSelectedIds()),
            });
        });

        modifyingDrawEvents.forEach((type) => {
            map.on(type, () => {
                setDrawFeatures(
                    new Map(
                        draw
                            .getAll()
                            .features.map((feature) => [
                                feature.id as string,
                                feature,
                            ])
                    )
                );
            });
        });

        map.on("draw.selectionchange", () => {
            setSelectedDrawFeatures(new Set(draw.getSelectedIds()));
        });

        map.on("draw.create", (e) => {
            let measure = document.querySelector("#donthatemeraffe") as any;
            measure.style.visibility = "hidden";

            stateUpdater.addFeatures(e.features);
            stateUpdater.sync();
            socket.emit("draw.create", e.features);
        });

        map.on("draw.delete", (e) => {
            const ids = e.features.map((feature) => feature.id as string);
            stateUpdater.removeFeatures(ids);
            stateUpdater.sync();
            socket.emit("draw.delete", ids);
        });

        socket.on("initState", (state) => {
            stateUpdater.setState(state);
            stateUpdater.sync();
            setDrawFeatures(
                new Map(
                    Object.entries(
                        stateUpdater.state().features as SharedState["features"]
                    )
                )
            );
        });

        socket.on("updateState", (diffs) => {
            stateUpdater.apply(diffs);
            stateUpdater.sync();
            setDrawFeatures(
                new Map(
                    Object.entries(
                        stateUpdater.state().features as SharedState["features"]
                    )
                )
            );
        });

        map.addControl(
            new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                //@ts-ignore
                mapboxgl: mapboxgl,
                reverseGeocode: true,
                localGeocoder: CoordinateGeocoder,
            })
        );
        map.addControl(draw);
    }, [container.current]);

    useEffect(() => {
        if (mapState === null) return;
        const drawIds = mapState.draw
            .getAll()
            .features.map((feature) => feature.id as string);
        if (
            mapState.drawFeatures.size !== drawIds.length ||
            !drawIds.every((id) => mapState.drawFeatures.has(id))
        )
            mapState.draw.set({
                type: "FeatureCollection",
                features: Array.from(mapState.drawFeatures.values()),
            });
    }, [mapState?.drawFeatures]);

    useEffect(() => {
        if (mapState === null) return;
        const selectedIds = mapState.draw.getSelectedIds();
        if (
            mapState.selectedDrawFeatures.size !== selectedIds.length ||
            !selectedIds.every((id) => mapState.selectedDrawFeatures.has(id))
        )
            mapState.draw.changeMode("simple_select", {
                featureIds: Array.from(mapState.selectedDrawFeatures),
            });
    }, [mapState?.selectedDrawFeatures]);

    useEffect(() => {
        if (shouldDraw) {
            mapState?.draw.changeMode("radius_circle" as any);
        } else {
            mapState?.draw.changeMode("simple_select");
        }
    }, [shouldDraw]);

    useEffect(() => {
        mapState?.map.setStyle(mapStyle);
    }, [mapStyle]);
    return <div className="w-full h-full">
        <div className="w-full h-full" ref={container}></div>
        <div id="donthatemeraffe" className="absolute pointer-events-none bg-white/50 p-1 ">
            <p id="measure-km"></p>
            <p id="measure-miles"></p>
        </div>
    </div>;
}

// setTimeout(() => map.setStyle("mapbox://styles/mapbox/dark-v10"), 3000)
