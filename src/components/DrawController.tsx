import React from "react";
import { useMapContext } from "./MapContext";

interface DrawControllerProps {
    shouldDraw: () => void;
}

export default function DrawController({ shouldDraw }: DrawControllerProps) {
    const { mapState, setSelectedDrawFeatures } = useMapContext();
    return (
        <>
            <button onClick={shouldDraw}>Draw</button>
            {mapState &&
                Array.from(mapState.drawFeatures)
                    .sort(([ida], [idb]) => ida.localeCompare(idb))
                    .map(([id, feature]) => (
                        <label key={id} className="border border-black">
                            <input
                                type="checkbox"
                                checked={mapState.selectedDrawFeatures.has(id)}
                                onChange={(e) => {
                                    const newSelected = new Set(
                                        mapState.selectedDrawFeatures
                                    );
                                    if (newSelected.has(id))
                                        newSelected.delete(id);
                                    else newSelected.add(id);
                                    setSelectedDrawFeatures(newSelected);
                                }}
                            ></input>
                            {feature.geometry.type}{" "}
                            {feature.id?.toString().substring(0, 8)}
                        </label>
                    ))}
        </>
    );
}
