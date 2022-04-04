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
    const canvasRef = useRef(null);
    const [points, addPoints] = useState<Point[]>([]);

    function drawAll(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(10, 10, 100, 100);    
        points.forEach((point) => drawPoint(ctx, point))
    }

    function drawPoint(ctx: CanvasRenderingContext2D, point: Point) {
        ctx.fillStyle = "red";
        ctx.fillRect(point.x, point.y, 10, 10);
    }

    async function drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement){
        console.log("drwa");
        ctx.drawImage(img, 0, 0);
        drawAll(ctx);
    }

    const fetchImage = async (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        //const url: string = `https://picsum.photos/${width}/${height}`;
        const url: string = 'https://media.hswstatic.com/eyJidWNrZXQiOiJjb250ZW50Lmhzd3N0YXRpYy5jb20iLCJrZXkiOiJnaWZcL21hcHMuanBnIiwiZWRpdHMiOnsicmVzaXplIjp7IndpZHRoIjo4Mjh9LCJ0b0Zvcm1hdCI6ImF2aWYifX0=';
        const res = await fetch(url);
        const imageBlob = await res.blob();
        const imageObjectURL = URL.createObjectURL(imageBlob);
        let img = new Image();
        img.src = imageObjectURL;
        img.onload = async () => await drawImage(ctx, img);
      };

      const handleCanvasClick=(event: any)=>{
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const bounds = canvas.getBoundingClientRect();
        const currentCoord = { x: event.clientX - bounds.left, y: event.clientY - bounds.top};
        addPoints([...points, currentCoord]);
      };

    useEffect(() => {
        const canvas: HTMLCanvasElement = canvasRef.current ?? new HTMLCanvasElement();
        const context: CanvasRenderingContext2D = canvas.getContext("2d") ?? new CanvasRenderingContext2D();

        fetchImage(context, context.canvas.width, context.canvas.height);
    });


    return <canvas onClick={handleCanvasClick} ref={canvasRef} width={width} height={height} />;
}

export default Canvas;