import { LngLat } from "mapbox-gl";
import React, { useCallback, useState } from "react";
import DrawController from "./DrawController";
import MapboxGlDraw from "./map/MapboxGlDraw";
import MapboxGlMap, { MapboxGlProps } from "./map/MapboxGlMap";
import { MapContextProvider, useMapContextProvider } from "./MapContext";

export default function App() {
    const [theme, changeTheme] = useState("mapbox://styles/mapbox/streets-v11");
    const [shouldDraw, setShouldDraw] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const setShouldDrawFunc = useCallback(
        () => setShouldDraw(!shouldDraw),
        [shouldDraw]
    );
    const mapContext = useMapContextProvider();

    const [mapboxProps, setMapboxProps] = useState<MapboxGlProps>({
        center: new LngLat(0, 0),
        zoom: 0,
        //style: theme,
        style: "/erland.style.json",
        testMode: true,
    });
    const setCenter = useCallback<
        React.Dispatch<React.SetStateAction<MapboxGlProps["center"]>>
    >((center) => {
        if (center instanceof Function)
            setMapboxProps((state) => ({
                ...state,
                center: center(state.center),
            }));
        else setMapboxProps((state) => ({ ...state, center }));
    }, []);
    const setZoom = useCallback<
        React.Dispatch<React.SetStateAction<MapboxGlProps["zoom"]>>
    >((zoom) => {
        if (zoom instanceof Function)
            setMapboxProps((state) => ({
                ...state,
                zoom: zoom(state.zoom),
            }));
        else setMapboxProps((state) => ({ ...state, zoom }));
    }, []);

    return (
        <MapContextProvider value={mapContext}>
            <div className="w-full h-full flex">
                <div className="w-full h-full flex relative">
                    {/*<WorldMap
                        shouldDraw={shouldDraw}
                        mapStyle={theme}
                    ></WorldMap>*/}
                    <MapboxGlMap
                        containerProps={{ className: "w-full h-full" }}
                        mapboxProps={mapboxProps}
                        listeners={{
                            center: setCenter,
                            zoom: setZoom,
                        }}
                    >
                        <MapboxGlDraw></MapboxGlDraw>
                    </MapboxGlMap>
                </div>
                <aside
                    className={`bg-white bg-opacity-[0.85] absolute top-0 left-0 bottom-0 flex flex-col transition-all ${
                        expanded ? "" : "-translate-x-full"
                    }`}
                >
                    <button
                        onClick={() => {
                            setExpanded(!expanded);
                        }}
                        className={`absolute transition-transform drop-shadow-md hover:scale-110 self-end text-m border border-neutral-200 rounded-full h-10 w-10 bg-white top-0 right-0 translate-y-1/4 ${
                            expanded ? "translate-x-1/2" : "translate-x-[125%]"
                        }`}
                    >
                        <span
                            className={`block transition-transform duration-500 ${
                                expanded ? "-scale-x-100" : ""
                            }`}
                        >
                            ❯
                        </span>
                    </button>
                    <div className="flex flex-col px-8 pt-5">
                        <select
                            onChange={(event) =>
                                changeTheme(event.target.value)
                            }
                        >
                            <option value="mapbox://styles/mapbox/streets-v11">
                                Light theme
                            </option>
                            <option value="mapbox://styles/mapbox/dark-v10">
                                Dark theme
                            </option>
                            <option value="mapbox://styles/mapbox/satellite-streets-v11">
                                Satellite
                            </option>
                        </select>
                        <DrawController
                            shouldDraw={setShouldDrawFunc}
                        ></DrawController>
                        <button
                            onClick={() =>
                                setCenter(
                                    (state) =>
                                        new LngLat(
                                            state.lng + 0.01,
                                            state.lat + 0.01
                                        )
                                )
                            }
                        >
                            Move
                        </button>
                        <span>
                            [{mapboxProps.center.lng.toFixed(2)},{" "}
                            {mapboxProps.center.lat.toFixed(2)}]
                        </span>
                        <span>{mapboxProps.zoom.toFixed(2)}</span>
                    </div>
                </aside>
            </div>
        </MapContextProvider>
    );
}
