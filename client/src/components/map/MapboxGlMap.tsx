import type { LngLat, MapboxOptions, MapEventType } from "mapbox-gl";
import MapboxGl from "mapbox-gl";
import type {
    DetailedHTMLProps,
    Dispatch,
    HTMLAttributes,
    JSXElementConstructor,
    PropsWithChildren,
    ReactElement,
    ReactNode,
    SetStateAction,
} from "react";
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    isMapboxGlContextConsumer,
    MapboxGlContext,
    MapboxGlContextProvider,
    useMapboxGlContext,
} from "./MapboxGlContext";

export type UseState<S> = [S, Dispatch<SetStateAction<S>>];

function usePrevious<T>(value: T) {
    const ref = useRef<T>();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

type PropHandler<T> = (
    ctx: MapboxGlContext,
    prop: T,
    onChange: OnPropChange<T> | undefined
) => UseState<T>;

type OnPropChange<T> = (value: T) => void;

function simplePropHandler<
    K extends keyof MapboxGlProps,
    T extends MapboxGlProps[K]
>(
    propKey: K,
    type: keyof MapEventType,
    getMapProp: (map: MapboxGl.Map) => T,
    setMapProp: (map: MapboxGl.Map, prop: T) => any,
    comparator: (prev: T, next: T) => boolean = Object.is
): PropHandler<T> {
    return (ctx, prop, onChange) => {
        const [ctxState, setCtxState] = ctx;
        const map = ctxState?.map;
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

        // Update context when state.value changes
        useEffect(() => {
            setCtxState((oldCtx) => {
                if (oldCtx === null) return null;
                const newCtx = { ...oldCtx };
                newCtx[propKey] = [
                    state.value,
                    setValue,
                ] as typeof newCtx[typeof propKey];
                return newCtx;
            });
        }, [state.value]);

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

MapboxGl.accessToken = import.meta.env.SNOWPACK_PUBLIC_ACCESS_TOKEN;

type AllDivProps = DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
>;

export type MapboxGlContainerProps = Pick<AllDivProps, "className"> | undefined;
export type MapboxGlProps = Required<Pick<MapboxOptions, "zoom" | "style">> &
    Pick<MapboxOptions, "testMode"> & { center: LngLat };

export interface MapboxGlMapProps {
    containerProps: MapboxGlContainerProps;
    mapboxProps: MapboxGlProps;
    listeners?: {
        [K in keyof MapboxGlProps]?:
            | boolean
            | ((value: MapboxGlProps[K]) => void);
    };
    listenToAllChanges?: boolean;
    children: ReactNode;
}

const mapPropHandlers: {
    [K in keyof MapboxGlProps]: PropHandler<MapboxGlProps[K]>;
} = {
    center: simplePropHandler(
        "center",
        "move",
        (map) => map.getCenter(),
        (map, center) => map.setCenter(center),
        (prev, next) =>
            Object.is(prev.lat, next.lat) && Object.is(prev.lng, next.lng)
    ),
    zoom: simplePropHandler(
        "zoom",
        "zoom",
        (map) => map.getZoom(),
        (map, zoom) => map.setZoom(zoom)
    ),
    style: () => {
        throw new Error("TODO");
    },
};

export default function MapboxGlMap(props: MapboxGlMapProps) {
    const ctx = useContext(MapboxGlContext);
    if (ctx !== undefined) {
        return <_MapboxGlMap {...props}></_MapboxGlMap>;
    }
    return (
        <MapboxGlContextProvider>
            <_MapboxGlMap {...props}></_MapboxGlMap>
        </MapboxGlContextProvider>
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
    const [state, setState] = useMapboxGlContext();

    const childListeners = useMemo(() => {
        return new Set(
            flatMap(
                (child) => child.type.mapboxGlListeners,
                filter(
                    isMapboxGlContextConsumer,
                    iterateComponentChildren(children)
                )
            )
        );
    }, [children]);

    const shouldListen = useMemo(() => {
        const listenKeys = Object.keys(
            mapPropHandlers
        ) as (keyof MapboxGlProps)[];
        return new Set(
            listenKeys.filter((key) => {
                if (listenToAllChanges) return true;
                if (listeners === undefined) return false;
                const listener = listeners[key];
                if (listener === undefined) return false;
                if (listener instanceof Function) return true;
                return listener;
            })
        );
    }, [listenToAllChanges, listeners]);

    const allListeners = useMemo(() => {
        return Array.from(new Set([...childListeners, ...shouldListen])).sort();
    }, [childListeners, shouldListen]);

    const previousAllListeners = usePrevious(allListeners);
    useEffect(() => {
        if (previousAllListeners === undefined) return;
        if (
            previousAllListeners.length === allListeners.length &&
            previousAllListeners.every(
                (previous, idx) => previous === allListeners[idx]
            )
        )
            return;

        const diff = new Set(previousAllListeners);
        allListeners.forEach((listen) => {
            if (diff.has(listen)) diff.delete(listen);
            else diff.add(listen);
        });
        throw new Error(
            `Listeners changed, set listenToAllChanges to true or set initially undefined listeners to true. These listeners were changed: ${Array.from(
                diff
            )}`
        );
    }, [previousAllListeners, allListeners]);

    shouldListen.forEach((key) => {
        const prop = mapboxProps[key];
        const handler = mapPropHandlers[key] as PropHandler<typeof prop>;
        const onChange = (
            listeners === undefined ? undefined : listeners[key]
        ) as OnPropChange<typeof prop> | undefined;
        handler([state, setState], prop, onChange);
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

function* iterateComponentChildren(
    node: ReactNode
): Generator<ReactElement<any, JSXElementConstructor<any>>> {
    if (node === undefined || node === null) return;
    if (!(node instanceof Object)) return;
    if (isIterable(node)) {
        // Fragments
        for (const child of node) {
            for (const nextNode of iterateComponentChildren(child)) {
                yield nextNode;
            }
        }
    } else if ("children" in node) {
        // ReactPortal
        for (const nextNode of iterateComponentChildren(node.children))
            yield nextNode;
    } else if ("type" in node) {
        // Normal component
        const type = node.type;
        // Don't scan other contexts
        if (type !== MapboxGlContext.Provider) {
            if (typeof type === "function") {
                yield node as ReactElement<any, typeof type>;
            }
            if ("children" in node.props) {
                const props: PropsWithChildren<unknown> = node.props;
                for (const child of iterateComponentChildren(props.children))
                    yield child;
            }
        }
    }
}

function* flatMap<T, R>(f: (x: T) => Iterable<R>, it: Generator<T>) {
    for (const x of it) for (const y of f(x)) yield y;
}

function* filter<T, S extends T>(f: (x: T) => x is S, it: Generator<T>) {
    for (const x of it) if (f(x)) yield x;
}

function isIterable<T>(obj: Object): obj is Iterable<T> {
    return Symbol.iterator in obj;
}
