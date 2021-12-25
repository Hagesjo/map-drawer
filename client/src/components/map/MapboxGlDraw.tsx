import { useEffect } from "react";
import { useMapboxGlContext } from "./MapboxGlContext";

export default function MapboxGlDraw() {
    const state = useMapboxGlContext();
    useEffect(() => {
        console.log("draw got state", state);
    }, [state]);
    return null;
}
