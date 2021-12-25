import type { Map } from "mapbox-gl";
import type { ReactNode } from "react";
import React, { createContext, useContext, useMemo, useState } from "react";
import type { MapboxGlProps, UseState } from "./MapboxGlMap";

export type MapboxGlContextState = { map: Map } & {
    [K in keyof MapboxGlProps]?: UseState<MapboxGlProps[K]>;
};

export type MapboxGlContext = UseState<MapboxGlContextState | null>;

export const MapboxGlContext = createContext<MapboxGlContext | undefined>(
    undefined
);

interface MapboxGlContextProviderProps {
    children?: ReactNode;
}

export function MapboxGlContextProvider({
    children,
}: MapboxGlContextProviderProps) {
    const [state, setState] = useState<MapboxGlContextState | null>(null);
    const memoizedState = useMemo<MapboxGlContext>(() => {
        return [state, setState];
    }, [state]);

    return (
        <MapboxGlContext.Provider value={memoizedState}>
            {children}
        </MapboxGlContext.Provider>
    );
}

export function useMapboxGlContext() {
    const ctx = useContext(MapboxGlContext);
    if (ctx === undefined) throw new Error("Missing MapboxGlContextProvider");
    return ctx;
}
