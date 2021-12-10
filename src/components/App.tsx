import React, { useState, useCallback } from "react";
import DrawController from "./DrawController";
import WorldMap from "./WorldMap";
import MapContext, { MapState } from "./MapContext";

export default function App() {
    const [theme, changeTheme] = useState("mapbox://styles/mapbox/streets-v11");
    const [shouldDraw, setShouldDraw] = useState(false);
    const setShouldDrawFunc = useCallback(
        () => setShouldDraw(!shouldDraw),
        [shouldDraw]
    );
    const [mapState, setMapState] = useState<MapState>({
        map: null,
        draw: null,
    });

    return (
        <MapContext.Provider value={mapState}>
            <div className="w-full h-full flex">
                <aside className="flex flex-col px-4">
                    <select
                        onChange={(event) => changeTheme(event.target.value)}
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
                    <LineViewer></LineViewer>
                </aside>
                <WorldMap
                    setMapState={setMapState}
                    shouldDraw={shouldDraw}
                    mapStyle={theme}
                ></WorldMap>
            </div>
        </MapContext.Provider>
    );
}
