import React, { useEffect, useRef, useState } from 'react'
import { fetchImage } from './api/dagonCanvasAPI';
import { Point, add, reversePointTransform } from './math/Point';
import { cursorStyles } from './tools/cursorStyles';
import { tools } from './tools/tools';
import ExampleButton from './misc/exampleButton';

interface IDagonCanvasProps {
    width: number;
    height: number;
}

function DagonCanvas({ width, height }: IDagonCanvasProps) {
    const defaultMapUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Africa_relief_location_map-no_borders.jpg';
    const markerSize = 10; //px
    const [mapImage, setMapImage] = useState(new Image());

    //Pan-zoom draw utils
    const canvasRef = useRef(null);
    const [markers, setMarkers] = useState<Point[]>([]);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);

    const [currentTool, setTool] = useState(tools.panCanvas);

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
        ctx.fillStyle = "red";
        ctx.fillRect(point.x - markerSize / 2, point.y - markerSize / 2, markerSize, markerSize);

        //не работает, надо потыкать
        ctx.font = `${16 + 16 * (1 / scale)}px Courier`;
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.fillText(point.name ?? "Без названия", point.x, point.y - markerSize);
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
        canvasTuple.context.clearRect(0, 0, realWidth, realHeight);
    }

    const drawEverything = async (mapUrl = defaultMapUrl) => {
        await clearCanvas();
        await drawMapFromCache(mapUrl);
        await drawPoints();
    };

    //Reset pan-zoom
    const resetPanZoom = () => {
        const canvasInstances = getCanvasInstances();
        canvasInstances.context.resetTransform();
        setTranslate({ x: 0, y: 0 });
    }

    const clearPoints = () => {
        setMarkers([]);
        setTranslate({ x: 0, y: 0 });
    }

    //initialization
    useEffect(() => {
        const canvasInstances = getCanvasInstances();

        //ТODO:
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
        //Здесь нужно обязательно очистить канвас перед изменением транслейта
        clearCanvas();
        ctx.translate(translate.x, translate.y);
        drawEverything();

    }, [translate]);

    //Zooming canvas
    const zoomCanvas = (zoomFactor: number) => {
        const ctx = getCanvasInstances().context;
        setScale(scale - zoomFactor);
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
        const pointName = prompt("Введите название", "Починки");
        if (pointName !== null) {
            const adjPoint = getPositionOnCanvas({ x: event.clientX, y: event.clientY, name: pointName })
            setMarkers([...markers, adjPoint]);
            setTool(tools.panCanvas);
        }
    };

    //#region Drag pan
    const [isDragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const startDrag = (event: React.MouseEvent) => {
        setDragging(true);
        setDragStart(getPositionOnCanvas({ x: event.clientX, y: event.clientY }));
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
        [tools.panCanvas, startDrag]
    ])

    return <div style={{ height: '100vh' }}>
        <div className='topBar' style={{ color: "white", background: "#1B1827", padding: '5px', display: 'flex', alignItems: "center" }}>
            <h4 style={{ color: 'white', margin: 0, marginLeft: '5px' }}>
                Project Dagon interactive map canvas
            </h4>

            <ExampleButton clickHandler={resetPanZoom} title={"Center view"} />
            <ExampleButton clickHandler={clearPoints} title={"Remove markers"} />
            <ExampleButton clickHandler={() => setTool(tools.panCanvas)} title="Move around" disabled={currentTool === tools.panCanvas} />
            <ExampleButton clickHandler={() => setTool(tools.plantMarker)} title={"Plant marker"} disabled={currentTool === tools.plantMarker} />
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