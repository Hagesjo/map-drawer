import { useEffect } from "react";
import { useMapboxGlMapContext } from "./MapboxGlMap";

export default function MapboxGlDraw() {
    const state = useMapboxGlMapContext();
    useEffect(() => {
        console.log("draw got state", state);
    }, [state]);
    return null;
}
