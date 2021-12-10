import WorldMapboxDraw from "@mapbox/mapbox-gl-draw";
import mapboxgl from "mapbox-gl";
import React, { useRef, useEffect, useState } from "react";

// @ts-ignore
mapboxgl.accessToken = import.meta.env.SNOWPACK_PUBLIC_ACCESS_TOKEN;

interface WorldMapProps {
    mapStyle: string;
    shouldDraw: boolean;
}

export default function WorldMap({ mapStyle, shouldDraw }: WorldMapProps) {
    const container = useRef<HTMLDivElement>(null);
    const [mapState, setMapState] = useState<{
        map: mapboxgl.Map;
        draw: MapboxDraw;
    }>({ map: null, draw: null });

    useEffect(() => {
        if (!container.current) return null;
        const map = new mapboxgl.Map({
            container: container.current, // container ID
            style: mapStyle, // style URL
            center: [11.970231148670322, 57.69103126724703], // starting position [lng, lat]
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

        setMapState({ map, draw });
        map.addControl(draw);
    }, [container.current]);

    useEffect(() => {
        if (!mapState.draw) {
            return;
        }
        if (shouldDraw) {
            mapState.draw.changeMode("draw_line_string");
        } else {
            mapState.draw.changeMode("simple_select");
        }
    }, [shouldDraw]);

    useEffect(() => {
        if (mapState.map) mapState.map.setStyle(mapStyle);
    }, [mapStyle]);
    return <div className="w-full h-full" ref={container}></div>;
}

// setTimeout(() => map.setStyle("mapbox://styles/mapbox/dark-v10"), 3000)
