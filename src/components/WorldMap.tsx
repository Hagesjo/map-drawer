import WorldMapboxDraw from "@mapbox/mapbox-gl-draw";
import mapboxgl from "mapbox-gl";
import React, { useEffect, useRef } from "react";
import { useMapContext } from "./MapContext";

// @ts-ignore
mapboxgl.accessToken = import.meta.env.SNOWPACK_PUBLIC_ACCESS_TOKEN;

interface WorldMapProps {
    mapStyle: string;
    shouldDraw: boolean;
}

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
        });

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

        map.addControl(draw);
    }, [container.current]);

    useEffect(() => {
        if (!mapState.draw) {
            return;
        }
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
