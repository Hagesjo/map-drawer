import type { Feature } from "geojson";
export interface ClientEvents {
    "draw.create": (features: Feature[]) => void;
    "draw.delete": (ids: string[]) => void;
}
