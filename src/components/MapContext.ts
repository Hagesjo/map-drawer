import type { Feature } from "geojson";
import { createContext, useCallback, useContext, useState } from "react";

interface MapContext {
    mapState: MapState | null;
    initMapState: (state: MapState) => void;
    setDrawFeatures: (drawFeatures: MapState["drawFeatures"]) => void;
    setSelectedDrawFeatures: (
        selectedDrawFeatures: MapState["selectedDrawFeatures"]
    ) => void;
}

interface MapState {
    map: mapboxgl.Map;
    draw: MapboxDraw;
    drawFeatures: ReadonlyMap<string, Feature>;
    selectedDrawFeatures: ReadonlySet<string>;
}

const MapContext = createContext<MapContext | undefined>(undefined);

export const MapContextProvider = MapContext.Provider;

export const useMapContextProvider: () => MapContext = () => {
    const [mapState, setMapState] = useState<MapContext["mapState"]>(null);

    const initMapState = useCallback((state: MapState) => {
        setMapState((oldState) => {
            if (oldState !== null)
                throw new Error("mapState already initialized");
            return state;
        });
    }, []);

    const setDrawFeatures = useCallback(
        (drawFeatures: MapState["drawFeatures"]) => {
            setMapState((oldState) => {
                if (oldState === null) return null;
                return { ...oldState, drawFeatures };
            });
        },
        []
    );

    const setSelectedDrawFeatures = useCallback(
        (selectedDrawFeatures: MapState["selectedDrawFeatures"]) => {
            setMapState((oldState) => {
                if (oldState === null) return null;
                return { ...oldState, selectedDrawFeatures };
            });
        },
        []
    );

    return {
        mapState,
        initMapState,
        setDrawFeatures,
        setSelectedDrawFeatures,
    };
};

export const useMapContext = () => {
    const mapContext = useContext(MapContext);
    if (mapContext === undefined)
        throw new Error("Missing MapContext.Provider");
    return mapContext;
};
