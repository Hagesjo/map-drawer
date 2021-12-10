import DrawControllerboxDraw from "@mapbox/mapbox-gl-draw";
import mapboxgl from "mapbox-gl";
import React, { useRef, useEffect, useState } from "react";

interface DrawControllerProps {
    shouldDraw: () => void;
}

export default function DrawController({ shouldDraw }: DrawControllerProps) {
    return <button onClick={shouldDraw}>Draw</button>;
}
