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
    const defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Map-Africa-Regions-Islands.png';
    const mapMarkerUrl = 'https://upload.wikimedia.org/wikipedia/commons/f/f2/678111-map-marker-512.png';
    const markerSize = 16; //px

    const canvasRef = useRef(null);
    const [points, addPoints] = useState<Point[]>([]);

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

    const drawEverything = async (ctx: CanvasRenderingContext2D, imgUrl = defaultImageUrl) => {
        let img = await fetchImage(imgUrl);
        img.onload = async () => { 
            await drawMap(ctx, img);
            await drawPoints(ctx);
        }
    };

    //Работает только с png и jpg. Для вектора нужно написать отдельный метод
    //По идее должно работать и с gif, но не хочет
    const fetchImage = async (imgUrl: string) => {
        const res = await fetch(imgUrl);
        const imageBlob = await res.blob();
        const imageObjectURL = URL.createObjectURL(imageBlob);
        let img = new Image();
        img.src = imageObjectURL;
        return img;
    }

    const handleCanvasClick = (event: any) => {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const bounds = canvas.getBoundingClientRect();
        const currentCoord = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
        addPoints([...points, currentCoord]);
    };

    useEffect(() => {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();

        drawEverything(context);
    });

    return <canvas onClick={handleCanvasClick} ref={canvasRef} width={width} height={height} />;
}

export default Canvas;