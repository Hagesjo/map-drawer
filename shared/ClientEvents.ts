import type { Feature } from "geojson";
export default interface ClientEvents {
    "draw.create": (features: Feature[]) => void;
    "draw.delete": (ids: String[]) => void;
}
