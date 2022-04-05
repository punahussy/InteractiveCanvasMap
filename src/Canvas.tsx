import { render } from '@testing-library/react';
import React, { MouseEvent, useEffect, useRef, useState } from 'react'

interface ICanvasProps {
    width: number;
    height: number;
}

interface Point {
    x: number;
    y: number;
}

function Canvas({ width, height }: ICanvasProps) {
    const defaultMapUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Map-Africa-Regions-Islands.png';
    const mapMarkerUrl = 'https://upload.wikimedia.org/wikipedia/commons/f/f2/678111-map-marker-512.png';
    const markerSize = 16; //px

    const canvasRef = useRef(null);
    const [points, addPoints] = useState<Point[]>([]);
    const [translateY, setTranslateY] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const [totalTranslate, setTotalTranslate] = useState({x: 0,y: 0});

    const imageCache: Map<string, HTMLImageElement> = new Map();

    async function drawPoint(ctx: CanvasRenderingContext2D, point: Point) {
        //ctx.fillStyle = "red";
        //ctx.fillRect(point.x, point.y, 10, 10);
        const marker = await fetchImage(mapMarkerUrl);
        marker.onload = () => ctx.drawImage(marker, point.x - markerSize / 2, point.y - markerSize, markerSize, markerSize);
    }

    function drawPoints(ctx: CanvasRenderingContext2D) {
        points.forEach(async (point) => await drawPoint(ctx, point))
    }

    async function drawMap(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
        ctx.drawImage(img, 0, 0);
    }

    const drawEverything = async (ctx: CanvasRenderingContext2D, imgUrl = defaultMapUrl) => {
        let img = await fetchImage(imgUrl);
        img.onload = async () => {
            await drawMap(ctx, img);
            await drawPoints(ctx);
        }
    };

    //Работает только с png и jpg. Для вектора нужно написать отдельный метод
    //По идее должно работать и с gif, но не хочет
    const fetchImage = async (imgUrl: string) => {
        const response = await fetch(imgUrl);
        const imageBlob = await response.blob();
        const imageObjectURL = URL.createObjectURL(imageBlob);
        let img = new Image();
        img.src = imageObjectURL;
        return img;
    }

    const fetchCachedImage = async (imgUrl: string) => {
        console.log(imageCache.has(imgUrl));
        if (!imageCache.has(imgUrl)) {
            console.log("was not in cache");
            const img = await fetchImage(imgUrl);
            imageCache.set(imgUrl, img);
            console.log("cached");
            console.log(imageCache);
        }
        const image = imageCache.get(imgUrl) ;
        return image ?? new Image();
    }

    const adjustPointPos = (point: Point, imatrix: DOMMatrix): Point => {
        const newX = point.x * imatrix.a + point.y * imatrix.c + imatrix.e;
        const newY = point.x * imatrix.b + point.y * imatrix.d + imatrix.f;
        return {x: newX, y: newY};
    }

    const handleCanvasClick = (event: any) => {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();

        const bounds = canvas.getBoundingClientRect();
        const currentCoord = { x: (event.clientX - bounds.left), y: event.clientY - bounds.top};

        const inverseMatrix = context.getTransform().inverse();
        const adjPoint = adjustPointPos(currentCoord, inverseMatrix);

        addPoints([...points, adjPoint]);
    };

    useEffect(() => {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();

        context.clearRect(0, 0, canvas.width, canvas.height);
        drawEverything(context);
    }, []);

    useEffect(() =>  {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();
        
        drawPoints(context);
    }, [points]);

    useEffect(() => {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();

        context.clearRect(0, 0, canvas.width - translateX, canvas.height + translateY);
        console.log(`TRANSLATE ${totalTranslate.x}, ${totalTranslate.y}`);
        context.translate(translateX, translateY);
        drawEverything(context);
    }, [translateY, translateX]);

    const handleCanvasPan = (event: any) => {
        setTranslateY(event.deltaY * -1);
        setTranslateX(event.deltaX * -1);
        setTotalTranslate({x: totalTranslate.x + event.deltaX, y: totalTranslate.y + event.deltaY});
    }

    return <div style={{ position: 'fixed' }}>
        <canvas onWheel={handleCanvasPan} onClick={handleCanvasClick} ref={canvasRef} width={width} height={height} />
    </div>;
}

export default Canvas;