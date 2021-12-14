import type { Feature } from "geojson";

// deep-diff only works with "primitive" values.
// Don't use Maps, Sets or other classes
export interface SharedState {
    features: Record<string, Feature>;
}
