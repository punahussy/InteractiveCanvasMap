import React, { useEffect, useRef, useState } from 'react'
import { fetchImage } from './api/dagonCanvasAPI';
import { Point, add, reversePointTransform, findPointInRadius } from './math/PointUtils';
import { cursorStyles } from './tools/cursorStyles';
import { tools } from './tools/tools';
import ExampleButton from './misc/exampleButton';

interface IDagonCanvasProps {
    width: number;
    height: number;
    mapUrl?: string;
    markerClickHandler?: (point: Point) => void;
}

function DagonCanvas({ width, height, mapUrl, markerClickHandler }: IDagonCanvasProps) {
    const defaultMapUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Africa_relief_location_map-no_borders.jpg';
    const markerSize = 10; //px
    const markerHitRadius = 10; //px
    const [markerFontSize, setMarkerFontSize] = useState(8 + 16);
    const [mapImage, setMapImage] = useState(new Image());

    //Pan-zoom draw utils
    const canvasRef = useRef(null);
    const [markers, setMarkers] = useState<Point[]>([]);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);

    const [currentTool, setCurrentTool] = useState(tools.panCanvas);

    function getCanvasInstances(): { canvas: HTMLCanvasElement, context: CanvasRenderingContext2D } {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();
        return { canvas, context };
    }

    const getPositionOnCanvas = (point: Point): Point => {
        const canvasInstances = getCanvasInstances();
        const bounds = canvasInstances.canvas.getBoundingClientRect();
        const currentCoord = { x: (point.x - bounds.left), y: point.y - bounds.top, name: point.name };
        const inverseMatrix = canvasInstances.context.getTransform().inverse();
        return reversePointTransform(currentCoord, inverseMatrix);
    }

    //draw single point with name
    async function drawPoint(point: Point) {
		const ctx = getCanvasInstances().context;
		ctx.fillStyle = 'red';
		ctx.strokeStyle = 'black';
		ctx.beginPath();
		ctx.arc(point.x, point.y, markerHitRadius, 0, 2 * Math.PI);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(point.x, point.y, markerHitRadius, 0, 2 * Math.PI);
		ctx.stroke();

        //auto resize text
		ctx.font = `bold ${markerFontSize}px Times new Roman`;
		ctx.textAlign = 'center';
		ctx.lineWidth = 2 + 2 * (1 / scale);
		ctx.strokeText(point.name ?? "Unnamed", point.x, point.y - markerHitRadius);
		ctx.fillStyle = 'white';
		ctx.fillText(point.name ?? "Unnamed", point.x, point.y - markerHitRadius);
    }

    //draw all points
    function drawPoints() {
        markers.forEach(async (point) => await drawPoint(point))
    }

    //Draw map
    async function drawMap(img: HTMLImageElement) {
        const ctx = getCanvasInstances().context;
        ctx.drawImage(img, 0, 0);
    }

    //Draw map from cache if available, if not, fetch and cache
    async function drawMapFromCache(mapUrl: string) {
        if (mapImage.src === "" || mapImage.src === undefined) {
            const img = await fetchImage(mapUrl);
            setMapImage(img);
            img.onload = async () => {
                await drawMap(img);
            }
        }
        else {
            await drawMap(mapImage);
        }
    }

    const clearCanvas = () => {
        const canvasTuple = getCanvasInstances();
        const newPos = getPositionOnCanvas({ x: canvasTuple.canvas.width, y: canvasTuple.canvas.height });
        const realWidth = canvasTuple.canvas.width + newPos.x;
        const realHeight = canvasTuple.canvas.height + newPos.y
        canvasTuple.context.clearRect(-canvasTuple.canvas.width, -canvasTuple.canvas.height, realWidth, realHeight);
    }

    const drawEverything = async () => {
        const imgUrl = mapUrl ?? defaultMapUrl;
        await clearCanvas();
        await drawMapFromCache(imgUrl);
        await drawPoints();
    };

    //Reset pan-zoom
    const resetPanZoom = () => {
        const canvasInstances = getCanvasInstances();
        canvasInstances.context.resetTransform();
        setMarkerFontSize(8 + 16 * (1 / scale));
        setTranslate({ x: 0, y: 0 });
    }

    //Zooming canvas
    const zoomCanvas = (zoomFactor: number) => {
        const ctx = getCanvasInstances().context;
        const matrix = ctx.getTransform();
		const scale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
        setScale(scale);
		setMarkerFontSize(8 + 16 * (1 / scale));
        ctx.scale(1 - zoomFactor, 1 - zoomFactor);
    }

    //Touchbar pan-zoom
    const handleTouchbarPanZoom = (event: WheelEvent) => {
        event.preventDefault();

        let zoomTranslate: Point = { x: 0, y: 0 };
        if (event.ctrlKey) {
            const zoomRate = event.deltaY * 0.01;
            zoomCanvas(zoomRate);
            const zoomPoint = getPositionOnCanvas({ x: event.clientX, y: event.clientY })
            zoomTranslate = { x: zoomPoint.x * zoomRate, y: zoomPoint.y * zoomRate };
        }

        const panTranslate = { x: event.deltaX * -1, y: event.deltaY * -1 };
        const newTranslate = add(zoomTranslate, panTranslate);
        setTranslate(newTranslate);
    }

    //add point
    const plantMarker = (event: React.MouseEvent) => {
        event.preventDefault();
        const pointName = prompt("Enter name", "Ljubljana");
        if (pointName !== null) {
            const adjPoint = getPositionOnCanvas({ x: event.clientX, y: event.clientY, name: pointName })
            setMarkers([...markers, adjPoint]);
            setCurrentTool(tools.panCanvas);
        }
    };

    const onMarkerClick = (event: React.MouseEvent) => {
        const clickPos = getPositionOnCanvas({ x: event.clientX, y: event.clientY });
        const closestMarker = findPointInRadius(markers, clickPos, markerSize);
        
        if (closestMarker.index !== undefined) {
            if (markerClickHandler) {
                markerClickHandler(markers[closestMarker.index]);
            }
            //TODO:
            const pointName = markers[closestMarker.index].name;
            let newName = prompt("Enter a new name:", pointName ?? "");
            if (newName) {
                //magic
                markers[closestMarker.index].name = newName;
                drawEverything();
                setCurrentTool(tools.panCanvas);
            }
        }
    }

    //#region Drag pan
    const [isDragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const startDrag = (event: React.MouseEvent) => {
        setDragging(true);
        const _dragStart = getPositionOnCanvas({ x: event.clientX, y: event.clientY });
        setDragStart(_dragStart);
    }

    const drag = (event: React.MouseEvent) => {
        if (isDragging) {
            const pointerPos = getPositionOnCanvas({ x: event.clientX, y: event.clientY });
            const newTranslate = { x: pointerPos.x - dragStart.x, y: pointerPos.y - dragStart.y };
            setTranslate(newTranslate);
        }
    }

    const endDrag = (event: React.MouseEvent) => {
        setDragging(false);
    }

    //#endregion Drag pan


    //Bindings of tool handlers to tools
    const toolHandlers = new Map<tools, (e: React.MouseEvent) => void>([
        [tools.plantMarker, plantMarker],
        [tools.panCanvas, startDrag],
        [tools.editMarker, onMarkerClick]
    ])

    //initialization
    useEffect(() => {
        const canvasInstances = getCanvasInstances();

        //Only works if binded here
        canvasInstances.canvas.addEventListener('wheel', handleTouchbarPanZoom, false);

        clearCanvas();
        drawEverything();
    }, []);

    //On markers update (draw last marker)
    useEffect(() => {
        if (markers.length > 0) {
            drawPoint(markers[markers.length - 1]);
        }
    }, [markers]);

    //On translate update
    useEffect(() => {
        const ctx = getCanvasInstances().context;
        //Clear canvas before translate
        ctx.translate(translate.x, translate.y);
        drawEverything();

    }, [translate]);

    return <div style={{ height: '100vh' }}>
        <h4 style={{ color: 'white', margin: '5px', boxShadow: '0px 4px 10px 3px rgba(0, 0, 0, 0.25)'}}>
            Interactive Canvas System (ICS)
        </h4>
        <div className='topBar' style={{ color: "white", background: "#1B1827", display: 'block', position: 'fixed', width: '5vw', height: '100vh', }}>


            <ExampleButton clickHandler={resetPanZoom} title={"Center view"} />
            <ExampleButton clickHandler={() => setCurrentTool(tools.panCanvas)} title="Move around" disabled={currentTool === tools.panCanvas} />
            <ExampleButton clickHandler={() => setCurrentTool(tools.plantMarker)} title={"Plant marker"} disabled={currentTool === tools.plantMarker} />
            <ExampleButton clickHandler={() => setCurrentTool(tools.editMarker)} title={"Edit marker"} disabled={currentTool === tools.editMarker} />
        </div>

        <div className='canvas' style={{ border: '3px solid #1B1827', background: '#332F46', cursor: isDragging ? "grabbing" : cursorStyles.get(currentTool) }}
            onMouseDown={event => {
                const handler = toolHandlers.get(currentTool);
                if (handler) {
                    handler(event);
                }
            }}
            onMouseMove={e => drag(e)}
            onMouseUp={e => endDrag(e)}>

            <canvas onContextMenu={e => e.preventDefault()} ref={canvasRef} width={width} height={height} />

        </div>
    </div>
}

export default DagonCanvas;