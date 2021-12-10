import React, { useContext } from "react";
import MapContext from "./MapContext";

interface DrawControllerProps {
    shouldDraw: () => void;
}

export default function DrawController({ shouldDraw }: DrawControllerProps) {
    const mapContext = useContext(MapContext);
    return <button onClick={shouldDraw}>Draw</button>;
}
