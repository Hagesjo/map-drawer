import React, { useCallback, useState } from "react";
import DrawController from "./DrawController";
import { MapContextProvider, useMapContextProvider } from "./MapContext";
import WorldMap from "./WorldMap";

export default function App() {
    const [theme, changeTheme] = useState("mapbox://styles/mapbox/streets-v11");
    const [shouldDraw, setShouldDraw] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const setShouldDrawFunc = useCallback(
        () => setShouldDraw(!shouldDraw),
        [shouldDraw]
    );
    const mapContext = useMapContextProvider();

    return (
        <MapContextProvider value={mapContext}>
            <div className="w-full h-full flex">
                <div className="w-full h-full flex relative">
                    <WorldMap
                        shouldDraw={shouldDraw}
                        mapStyle={theme}
                    ></WorldMap>
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
                    </div>
                </aside>
            </div>
        </MapContextProvider>
    );
}
