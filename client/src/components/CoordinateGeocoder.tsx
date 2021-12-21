import type MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

export default function CoordinateGeocoder(query: string) {
    const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
    );
    if (!matches) {
        return [];
    }
    const bboxInterval = 0.1;
    function coordinateFeature(
        lat: number,
        lng: number
    ): MapboxGeocoder.Result {
        return {
            center: [lng, lat],
            geometry: {
                type: "Point",
                coordinates: [lng, lat],
            },
            // place_name: "Lat: " + lat + " Lng: " + lng,
            place_name: query,
            place_type: ["coordinate"],
            properties: {},
            type: "Feature",
            text: "tjenna",
            bbox: [
                lng - bboxInterval,
                lat - bboxInterval,
                lng + bboxInterval,
                lat + bboxInterval,
            ],
            relevance: 0,
            address: "",
            context: [],
        };
    }

    const coord1 = Number(matches[1]);
    const coord2 = Number(matches[2]);
    const geocodes = [];

    if (coord1 < -90 || coord1 > 90) {
        // must be lng, lat
        geocodes.push(coordinateFeature(coord1, coord2));
    }

    if (coord2 < -90 || coord2 > 90) {
        // must be lat, lng
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    if (geocodes.length === 0) {
        // else could be either lng, lat or lat, lng
        geocodes.push(coordinateFeature(coord1, coord2));
    }

    return geocodes;
}
