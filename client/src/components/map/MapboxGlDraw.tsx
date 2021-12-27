import { useMapboxGlContext, withMapboxGlContext } from "./MapboxGlContext";

export default withMapboxGlContext(function MapboxGlDraw() {
    const ctx = useMapboxGlContext();
    return null;
}, "zoom");
