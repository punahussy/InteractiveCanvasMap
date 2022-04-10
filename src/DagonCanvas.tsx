import React, { useEffect, useRef, useState } from 'react'
import { fetchImage } from './api/dagonCanvasAPI';
import { Point, add } from './math/Point';

interface IDagonCanvasProps {
    width: number;
    height: number;
}

function DagonCanvas({ width, height }: IDagonCanvasProps) {
    //const defaultMapUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Blank_Map_-_RussiaFederalSubjects_2007-07.svg/2560px-Blank_Map_-_RussiaFederalSubjects_2007-07.svg.png';
    const defaultMapUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Africa_relief_location_map-no_borders.jpg';
    const markerSize = 10; //px

    const [mapImage, setMapImage] = useState(new Image());

    const canvasRef = useRef(null);
    const [points, addPoints] = useState<Point[]>([]);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });

    //drawing point with name
    async function drawPoint(ctx: CanvasRenderingContext2D, point: Point) {
        ctx.fillStyle = "red";
        ctx.fillRect(point.x - markerSize / 2, point.y - markerSize / 2, markerSize, markerSize);
        ctx.font = `16px Courier`;
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.fillText(point.name ?? "Без названия", point.x, point.y - markerSize);
    }

    //draw all points
    function drawPoints(ctx: CanvasRenderingContext2D) {
        points.forEach(async (point) => await drawPoint(ctx, point))
    }

    async function drawMap(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
        ctx.drawImage(img, 0, 0);
    }

    async function drawMapFromCache(ctx: CanvasRenderingContext2D, mapUrl: string) {
        if (mapImage.src === "" || mapImage.src === undefined) {
            const img = await fetchImage(mapUrl);
            setMapImage(img);
            img.onload = async () => {
                await drawMap(ctx, img);
            }
        }
        else {
            await drawMap(ctx, mapImage);
        }
    }

    const drawEverything = async (ctx: CanvasRenderingContext2D, mapUrl = defaultMapUrl) => {
        await clearCanvas(ctx.canvas, ctx);
        await drawMapFromCache(ctx, mapUrl);
        await drawPoints(ctx);
    };

    const adjustPointPos = (point: Point, imatrix: DOMMatrix): Point => {
        const newX = point.x * imatrix.a + point.y * imatrix.c + imatrix.e;
        const newY = point.x * imatrix.b + point.y * imatrix.d + imatrix.f;
        return { x: newX, y: newY, name: point.name };
    }

    const getPositionOnCanvas = (point: Point): Point => {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();

        const bounds = canvas.getBoundingClientRect();
        const currentCoord = { x: (point.x - bounds.left), y: point.y - bounds.top, name: point.name };
        const inverseMatrix = context.getTransform().inverse();
        return adjustPointPos(currentCoord, inverseMatrix);
    }

    const clearCanvas = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
        const newPos = adjustPointPos({ x: canvas.width, y: canvas.height }, context.getTransform().inverse());
        const realWidth = canvas.width + newPos.x;
        const realHeight = canvas.height + newPos.y
        context.clearRect(0, 0, realWidth, realHeight);
    }

    //initialization
    useEffect(() => {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();

        //Тут ничего не трогать, иначе всё почему-то перестает работать
        canvas.addEventListener('wheel', handleTouchbarPanZoom, false);
        canvas.addEventListener('mousedown', onPointerDown, false);
        canvas.addEventListener('mousemove', onPointerMove, false);
        canvas.addEventListener('mouseup', onPointerUp, false);

        clearCanvas(canvas, context);
        drawEverything(context);
    }, []);

    //drawing points
    useEffect(() => {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();
        if (points.length > 0) {
            drawPoint(context, points[points.length - 1]);
        }
    }, [points]);

    //pan-zoom
    useEffect(() => {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();

        clearCanvas(canvas, context);
        context.translate(translate.x, translate.y);
        drawEverything(context);

    }, [translate]);

    //add point
    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
        const pointName = prompt("Введите название", "Починки");
        if (pointName !== null) {
            const adjPoint = getPositionOnCanvas({ x: event.clientX, y: event.clientY, name: pointName })
            addPoints([...points, adjPoint]);
        }
    };

    //Touchbar pan-zoom
    const handleTouchbarPanZoom = (event: WheelEvent) => {
        event.preventDefault();

        let zoomTranslate: Point = {x: 0, y: 0};
        if (event.ctrlKey) {
            const zoomRate = event.deltaY * 0.01;
            zoomCanvas(zoomRate);
            const zoomPoint = getPositionOnCanvas({x: event.clientX, y: event.clientY})
            const zoomTranslate = {x: zoomPoint.x * zoomRate, y: zoomPoint.y * zoomRate};
            setTranslate(zoomTranslate);
        }

        const panTranslate = { x: event.deltaX * -1, y: event.deltaY * -1 };
        const newTranslate = add(zoomTranslate, panTranslate);
        setTranslate(newTranslate);
    }

    //#region Drag pan
    let isDragging: boolean = false;
    let dragStart: Point = { x: 0, y: 0 }

    const onPointerDown = (event: MouseEvent) => {
        if (event.button === 0) {
            isDragging = true;
            dragStart = getPositionOnCanvas({ x: event.clientX, y: event.clientY });
        }
    }

    const onPointerUp = (event: MouseEvent) => {
        isDragging = false;
    }

    const onPointerMove = (event: MouseEvent) => {
        if (isDragging && event.button === 0) {
            const pointerPos = getPositionOnCanvas({ x: event.clientX, y: event.clientY });
            const newTranslate = { x: pointerPos.x - dragStart.x, y: pointerPos.y - dragStart.y };
            setTranslate(newTranslate);
        }
    }

    //#endregion Drag pan

    //Zooming canvas
    const zoomCanvas = (zoomFactor: number) => {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();

        context.scale(1 - zoomFactor, 1 - zoomFactor);
    }
    
    //Clear points and pan-zoom
    const resetCanvas = () => {
        addPoints([]);
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();
        
        context.resetTransform();
        setTranslate({x: 0, y: 0});
    }

    return <div style={{height: '100vh'}}>
        <div className='buttons' style={{ background: "blue", padding: '5px', display: 'flex' }}>
            <h4 style={{color: 'white', margin: 0}} >LMB - Move, RMB - Place marker</h4>
            <button onClick={() => resetCanvas()}>Reset</button>
            <button onClick={() => zoomCanvas(2)}>+</button>
            <button onClick={() => zoomCanvas(0.5)}>-</button>
        </div>
        <div className='canvas' style={{border: '3px solid green', userSelect: 'none', background: '#4a2c2a' }}>            
            <canvas onContextMenu={(e) => handleClick(e)} ref={canvasRef} width={width} height={height} />
        </div>
    </div>
}

export default DagonCanvas;