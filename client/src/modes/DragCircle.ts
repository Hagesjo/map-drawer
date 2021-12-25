import MapboxDraw, {
    DrawActionableState,
    DrawCustomMode
} from "@mapbox/mapbox-gl-draw";
import circle from "@turf/circle";
import distance from "@turf/distance";
import * as turfHelpers from "@turf/helpers";

const ActualDrawModes = (MapboxDraw.modes as unknown) as Record<
    MapboxDraw.DrawMode,
    DrawCustomMode
>;
const DragCircleMode = { ...ActualDrawModes.draw_polygon };
export default DragCircleMode;

DragCircleMode.onSetup = function(opts) {
    const polygon = this.newFeature({
        type: "Feature",
        properties: {
            isCircle: true,
            center: []
        },
        geometry: {
            type: "Polygon",
            coordinates: [[]]
        }
    });

    this.addFeature(polygon);

    this.clearSelectedFeatures();
    disable(this);
    this.updateUIClasses({ mouse: "add" });
    this.activateUIButton("Polygon");
    this.setActionableState({
        trash: true
    } as DrawActionableState);

    return {
        polygon,
        currentVertexPosition: 0
    };
};

DragCircleMode.onMouseDown = DragCircleMode.onTouchStart = function(
    state,
    e: any
) {
    const currentCenter = state.polygon.properties.center;
    if (currentCenter.length === 0) {
        state.polygon.properties.center = [e.lngLat.lng, e.lngLat.lat];
    }
};

DragCircleMode.onDrag = DragCircleMode.onMouseMove = function(state, e: any) {
    const center = state.polygon.properties.center;
    if (center.length > 0) {
        const distanceInKm = distance(
            turfHelpers.point(center),
            turfHelpers.point([e.lngLat.lng, e.lngLat.lat]),
            { units: "kilometers" }
        );
        const circleFeature = circle(center, distanceInKm);
        state.polygon.incomingCoords(circleFeature.geometry.coordinates);
        state.polygon.properties.radiusInKm = distanceInKm;
    }
};

DragCircleMode.onMouseUp = DragCircleMode.onTouchEnd = function(state, e: any) {
    enable(this);
    return this.changeMode("simple_select", { featureIds: [state.polygon.id] });
};

DragCircleMode.onClick = DragCircleMode.onTap = function(state, e: any) {
    // don't draw the circle if its a tap or click event
    state.polygon.properties.center = [];
};

DragCircleMode.toDisplayFeatures = function(state, geojson, display) {
    if ("properties" in geojson && geojson.properties !== null) {
        const isActivePolygon = geojson.properties.id === state.polygon.id;
        geojson.properties.active = isActivePolygon ? "true" : "false";
    }
    if (state.polygon.properties.center.length > 0) {
        return display(geojson);
    }
};

function enable(ctx: any) {
    setTimeout(() => {
        // First check we've got a map and some context.
        if (
            !ctx.map ||
            !ctx.map.dragPan ||
            !ctx._ctx ||
            !ctx._ctx.store ||
            !ctx._ctx.store.getInitialConfigValue
        )
            return;
        // Now check initial state wasn't false (we leave it disabled if so)
        if (!ctx._ctx.store.getInitialConfigValue("dragPan")) return;
        ctx.map.dragPan.enable();
    }, 0);
}

function disable(ctx: any) {
    setTimeout(() => {
        if (!ctx.map || !ctx.map.doubleClickZoom) return;
        // Always disable here, as it's necessary in some cases.
        ctx.map.dragPan.disable();
    }, 0);
}
