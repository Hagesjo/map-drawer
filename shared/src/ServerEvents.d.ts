import type { Feature } from "geojson";
export interface ServerEvents {
    "hello world": (payload: string, cb: (n: number) => void) => void;
    features: (features: Feature[]) => void;
}
