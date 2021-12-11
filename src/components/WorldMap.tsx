import WorldMapboxDraw, {
    DrawActionableEvent,
    DrawCombineEvent,
    DrawCreateEvent,
    DrawDeleteEvent,
    DrawEventType,
    DrawModeChageEvent,
    DrawRenderEvent,
    DrawSelectionChangeEvent,
    DrawUncombineEvent,
    DrawUpdateEvent,
} from "@mapbox/mapbox-gl-draw";
import mapboxgl from "mapbox-gl";
import React, { useEffect, useRef } from "react";
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
    "draw.delete",
    "draw.combine",
    "draw.uncombine",
];

export default function WorldMap({ mapStyle, shouldDraw }: WorldMapProps) {
    const { mapState, initMapState, setDrawFeatures, setSelectedDrawFeatures } =
        useMapContext();
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!container.current || mapState !== null) return;
        const map = new mapboxgl.Map({
            container: container.current, // container ID
            style: mapStyle, // style URL
            // center: [11.970231148670322, 57.69103126724703], // starting position [lng, lat]
            center: [-122.486052, 37.830348],
            zoom: 12, // starting zoom
        }) as DrawMap & mapboxgl.Map;

        const draw = new WorldMapboxDraw({
            displayControlsDefault: false,
            // Select which mapbox-gl-draw control buttons to add to the map.
            controls: {
                polygon: true,
                line_string: true,
                trash: true,
            },
            // Set mapbox-gl-draw to draw by default.
            // The user does not have to click the polygon control button first.
            // defaultMode: "draw_polygon",
        });

        map.on("load", () => {
            draw.add({
                type: "LineString",
                coordinates: [
                    [-122.483696, 37.833818],
                    [-122.484482, 37.833174],
                ],
            });
            draw.add({
                type: "LineString",
                coordinates: [
                    [-122.484696, 37.833818],
                    [-122.485482, 37.833174],
                ],
            });
            draw.add({
                type: "LineString",
                coordinates: [
                    [-122.486696, 37.833818],
                    [-122.488482, 37.833174],
                ],
            });
            draw.add({
                type: "LineString",
                coordinates: [
                    [-122.483696, 37.833818],
                    [-122.483482, 37.833174],
                ],
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

        map.addControl(draw);
    }, [container.current]);

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
            mapState?.draw.changeMode("draw_line_string");
        } else {
            mapState?.draw.changeMode("simple_select");
        }
    }, [shouldDraw]);

    useEffect(() => {
        mapState?.map.setStyle(mapStyle);
    }, [mapStyle]);
    return <div className="w-full h-full" ref={container}></div>;
}

// setTimeout(() => map.setStyle("mapbox://styles/mapbox/dark-v10"), 3000)
