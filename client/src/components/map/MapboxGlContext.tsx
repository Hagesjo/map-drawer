import type { Map } from "mapbox-gl";
import type {
    ComponentType,
    JSXElementConstructor,
    ReactElement,
    ReactNode,
} from "react";
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

export interface MapboxGlContextConsumer {
    mapboxGlListeners?: (keyof MapboxGlProps)[];
}

export function withMapboxGlContext<T extends ComponentType>(
    node: T,
    ...listeners: (keyof MapboxGlProps)[]
) {
    const withNode: T & MapboxGlContextConsumer = node;
    withNode.mapboxGlListeners = listeners;
    return withNode;
}

export function isMapboxGlContextConsumer(
    node: ReactElement<any, JSXElementConstructor<any>>
): node is ReactElement<
    any,
    JSXElementConstructor<any> & Required<MapboxGlContextConsumer>
> {
    const key: keyof MapboxGlContextConsumer = "mapboxGlListeners";
    return key in node.type;
}
