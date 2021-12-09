import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

mapboxgl.accessToken = "";
const map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/mapbox/streets-v11", // style URL
    center: [11.970231148670322, 57.69103126724703], // starting position [lng, lat]
    zoom: 12, // starting zoom
});

const draw = new MapboxDraw({
    displayControlsDefault: false,
    // Select which mapbox-gl-draw control buttons to add to the map.
    controls: {
        polygon: true,
        trash: true,
    },
    // Set mapbox-gl-draw to draw by default.
    // The user does not have to click the polygon control button first.
    defaultMode: "draw_polygon",
});
map.addControl(draw);
// setTimeout(() => map.setStyle("mapbox://styles/mapbox/dark-v10"), 3000)

map.on("draw.create", updateArea);
map.on("draw.delete", updateArea);
map.on("draw.update", updateArea);
// (map.dragRotate as any)._mousePitch.disablko();
// map.addControl(new mapboxgl.NavigationControl());

function updateArea(e: any) {
    const data = draw.getAll();
    const answer = document.getElementById("calculated-area");
}
