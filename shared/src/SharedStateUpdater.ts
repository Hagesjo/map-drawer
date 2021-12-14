import type { Feature } from "geojson";
import type { SharedState } from "./SharedState";
import { StateUpdater } from "./StateUpdater.js";

class SharedStateUpdater extends StateUpdater<SharedState> {
    constructor() {
        super({ features: {} });
    }
    addFeatures(features: Feature[]) {
        features.forEach(
            (feature) => (this.next.features[feature.id as string] = feature)
        );
    }
    removeFeatures(ids: string[]) {
        ids.forEach((id) => delete this.next.features[id]);
    }
}

export const stateUpdater = new SharedStateUpdater();
