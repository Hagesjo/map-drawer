import type { Feature } from "geojson";
import { createContext, useCallback, useContext, useState } from "react";

interface MapContext {
    mapState: MapState | null;
    initMapState: (state: MapState) => void;
    setDrawFeatures: (
        drawFeaturesOrCb:
            | MapState["drawFeatures"]
            | ((
                  oldDrawFeatures: MapState["drawFeatures"]
              ) => MapState["drawFeatures"])
    ) => void;
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

    const initMapState = useCallback<MapContext["initMapState"]>(
        (state: MapState) => {
            setMapState((oldState) => {
                if (oldState !== null)
                    throw new Error("mapState already initialized");
                return state;
            });
        },
        []
    );

    const setDrawFeatures = useCallback<MapContext["setDrawFeatures"]>(
        (drawFeaturesOrCb) => {
            setMapState((oldState) => {
                if (oldState === null) return null;
                const drawFeatures =
                    typeof drawFeaturesOrCb === "function"
                        ? drawFeaturesOrCb(oldState.drawFeatures)
                        : drawFeaturesOrCb;
                let selectedDrawFeatures = oldState.selectedDrawFeatures;
                if (
                    !Array.from(selectedDrawFeatures).every((id) =>
                        drawFeatures.has(id)
                    )
                ) {
                    selectedDrawFeatures = new Set(
                        Array.from(oldState.selectedDrawFeatures).filter((id) =>
                            drawFeatures.has(id)
                        )
                    );
                }
                return { ...oldState, drawFeatures, selectedDrawFeatures };
            });
        },
        []
    );

    const setSelectedDrawFeatures = useCallback<
        MapContext["setSelectedDrawFeatures"]
    >((selectedDrawFeatures) => {
        setMapState((oldState) => {
            if (oldState === null) return null;
            selectedDrawFeatures = new Set(
                Array.from(selectedDrawFeatures).filter((id) =>
                    oldState.drawFeatures.has(id)
                )
            );
            return { ...oldState, selectedDrawFeatures };
        });
    }, []);

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
