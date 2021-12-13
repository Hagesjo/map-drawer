import React, { useCallback, useState } from "react";
import DrawController from "./DrawController";
import { MapContextProvider, useMapContextProvider } from "./MapContext";
import WorldMap from "./WorldMap";

export default function App() {
    const [theme, changeTheme] = useState("mapbox://styles/mapbox/streets-v11");
    const [shouldDraw, setShouldDraw] = useState(false);
    const setShouldDrawFunc = useCallback(
        () => setShouldDraw(!shouldDraw),
        [shouldDraw]
    );
    const mapContext = useMapContextProvider();

    return (
        <MapContextProvider value={mapContext}>
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
                </aside>
                <WorldMap shouldDraw={shouldDraw} mapStyle={theme}></WorldMap>
            </div>
        </MapContextProvider>
    );
}
