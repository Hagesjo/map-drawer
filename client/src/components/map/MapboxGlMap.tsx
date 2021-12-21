import type { LngLat, MapboxOptions, MapEventType } from "mapbox-gl";
import MapboxGl from "mapbox-gl";
import type {
    DetailedHTMLProps,
    Dispatch,
    HTMLAttributes,
    ReactNode,
    SetStateAction,
} from "react";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

function usePrevious<T>(value: T) {
    const ref = useRef<T>();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

type PropHandler<T> = (
    map: MapboxGl.Map | undefined,
    prop: T,
    onChange: ((value: T) => void) | undefined
) => [T, Dispatch<SetStateAction<T>>];

function simplePropHandler<E extends keyof MapEventType, T>(
    type: E,
    getMapProp: (map: MapboxGl.Map) => T,
    setMapProp: (map: MapboxGl.Map, prop: T) => any,
    comparator: (prev: T, next: T) => boolean = Object.is
): PropHandler<T> {
    return (map, prop, onChange) => {
        const [state, setState] = useState({
            truth: false, // true if the value came from the actual map
            value: prop,
        });

        // Update the state once the map is available
        useEffect(() => {
            if (map === undefined) return;
            setState({ truth: true, value: getMapProp(map) });
        }, [map]);

        // Propagate changes to prop into the map
        const previousProp = usePrevious(prop);
        useEffect(() => {
            if (map === undefined) return;
            if (previousProp !== undefined && comparator(previousProp, prop))
                return;
            if (comparator(prop, state.value)) return;
            if (comparator(getMapProp(map), prop)) return;

            // Break infinite loop caused by
            // setMapProp -> map event -> setState -> onChange -> setMapProp ...
            const timeout = setTimeout(() => setMapProp(map, prop), 0);
            return () => clearTimeout(timeout);
        }, [map, previousProp, prop, state.value]);

        // Propagate changes in the map to the state
        useEffect(() => {
            if (map === undefined) return;

            const listener = () => {
                setState({ truth: true, value: getMapProp(map) });
            };
            map.on(type, listener);
            return () => {
                map.off(type, listener);
            };
        }, [map]);

        // Notify our onChange listener, if any, when state.value changes
        const previousOnChange = usePrevious(onChange);
        useEffect(() => {
            // Don't fire just because the listener changed
            if (!Object.is(previousOnChange, onChange)) return;
            if (onChange === undefined) return;

            onChange(state.value);
        }, [state.value, previousOnChange, onChange]);

        // Propagate changes in state.value into the map
        const previousState = usePrevious(state);
        useEffect(() => {
            // If state.truth is true, then we skip propagation
            // because our latest state already came from the map, so why update it again
            // This prevents edge cases where our map listeners doesn't quite keep up with
            // the actual value in the map, causing hitching for things like zoom and center
            if (map === undefined || state.truth) return;
            if (
                previousState !== undefined &&
                comparator(previousState.value, state.value)
            )
                return;
            if (comparator(getMapProp(map), state.value)) return;

            setMapProp(map, state.value);
        }, [map, previousState?.value, state.value]);

        // Only expose state.value
        const setValue = useCallback<Dispatch<SetStateAction<T>>>((value) => {
            if (value instanceof Function)
                setState((state) => ({
                    truth: false,
                    value: value(state?.value),
                }));
            else setState({ truth: false, value });
        }, []);
        return [state.value, setValue];
    };
}

MapboxGl.accessToken = (
    import.meta as unknown as { env: { SNOWPACK_PUBLIC_ACCESS_TOKEN: string } }
).env.SNOWPACK_PUBLIC_ACCESS_TOKEN;

interface MapboxGlMapContextState {
    map: MapboxGl.Map | undefined;
    center?: ReturnType<typeof mapPropHandlers["center"]>;
    zoom?: ReturnType<typeof mapPropHandlers["zoom"]>;
}

type MapboxGlContextReactState = [
    MapboxGlMapContextState | null,
    Dispatch<SetStateAction<MapboxGlMapContextState | null>>
];

const MapboxGlMapContext = createContext<MapboxGlContextReactState | undefined>(
    undefined
);

export function MapboxGlMapContextProvider({
    children,
}: {
    children?: ReactNode;
}) {
    const [state, setState] = useState<MapboxGlMapContextState | null>(null);
    const value = useMemo<MapboxGlContextReactState>(() => {
        return [state, setState];
    }, [state]);

    return (
        <MapboxGlMapContext.Provider value={value}>
            {children}
        </MapboxGlMapContext.Provider>
    );
}

export function _useMapboxGlMapContext() {
    const ctx = useContext(MapboxGlMapContext);
    if (ctx === undefined)
        throw new Error("Missing MapboxGlMapContext.Provider");
    return ctx;
}

export function useMapboxGlMapContext(): MapboxGlMapContextState | null {
    return _useMapboxGlMapContext()[0];
}

const mapPropHandlers: {
    [K in keyof MapboxGlProps]: PropHandler<MapboxGlProps[K]>;
} = {
    center: simplePropHandler(
        "move",
        (map) => map.getCenter(),
        (map, center) => map.setCenter(center),
        (prev, next) =>
            Object.is(prev.lat, next.lat) && Object.is(prev.lng, next.lng)
    ),
    zoom: simplePropHandler(
        "zoom",
        (map) => map.getZoom(),
        (map, zoom) => map.setZoom(zoom)
    ),
    style: () => {
        throw new Error("TODO");
    },
};

type AllDivProps = DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
>;

export type MapboxGlContainerProps = Pick<AllDivProps, "className"> | undefined;
export type MapboxGlProps = Required<
    Pick<MapboxOptions, "zoom" | "style"> & { center: LngLat }
>;

export interface MapboxGlMapProps {
    containerProps: MapboxGlContainerProps;
    mapboxProps: MapboxGlProps;
    listeners?: {
        [K in keyof MapboxGlProps]?:
            | boolean
            | ((value: MapboxGlProps[K]) => void);
    };
    listenToAllChanges?: boolean;
    children?: ReactNode;
}

export default function MapboxGlMap(props: MapboxGlMapProps) {
    const ctx = useContext(MapboxGlMapContext);
    if (ctx !== undefined) {
        return <_MapboxGlMap {...props}></_MapboxGlMap>;
    }
    return (
        <MapboxGlMapContextProvider>
            <_MapboxGlMap {...props}></_MapboxGlMap>
        </MapboxGlMapContextProvider>
    );
}

function _MapboxGlMap({
    containerProps,
    mapboxProps,
    listeners,
    listenToAllChanges,
    children,
}: MapboxGlMapProps) {
    const container = useRef<HTMLDivElement>(null);
    const [state, setState] = _useMapboxGlMapContext();

    const shouldListen = useMemo(() => {
        const listenKeys = Object.keys(
            mapPropHandlers
        ) as (keyof MapboxGlProps)[];
        return listenKeys
            .filter((key) => {
                if (listenToAllChanges) return true;
                if (listeners === undefined) return false;
                const listener = listeners[key];
                if (listener === undefined) return false;
                if (listener instanceof Function) return true;
                return listener;
            })
            .sort();
    }, [listenToAllChanges, listeners]);
    const previousShouldListen = usePrevious(shouldListen);
    useEffect(() => {
        if (previousShouldListen === undefined) return;
        if (
            previousShouldListen.length === shouldListen.length &&
            previousShouldListen.every(
                (previous, idx) => previous === shouldListen[idx]
            )
        )
            return;

        const diff = new Set(previousShouldListen);
        shouldListen.forEach((listen) => {
            if (diff.has(listen)) diff.delete(listen);
            else diff.add(listen);
        });
        throw new Error(
            `Listeners changed, set listenToAllChanges to true or set initially undefined listeners to true. These listeners were changed: ${Array.from(
                diff
            )}`
        );
    }, [previousShouldListen, shouldListen]);

    shouldListen.forEach((key) => {
        const prop = mapboxProps[key];
        const handler = mapPropHandlers[key] as PropHandler<typeof prop>;
        const onChange = (
            listeners === undefined ? undefined : listeners[key]
        ) as ((value: typeof prop) => void) | undefined;
        handler(state?.map, prop, onChange);
    });

    useEffect(() => {
        // React pls, why call it twice, check state so we don't break stuff
        if (container.current === null || state !== null) return;

        setState({
            map: new MapboxGl.Map({
                ...mapboxProps,
                container: container.current,
            }),
        });
    }, [container.current, state]);

    return (
        <div {...containerProps} ref={container}>
            {children}
        </div>
    );
}
