import { tools } from "./tools";

export const cursorStyles = new Map<tools, string>([
    [tools.panCanvas, "grab"],
    [tools.plantMarker, "crosshair"],
    [tools.editMarker, "pointer"]
]);