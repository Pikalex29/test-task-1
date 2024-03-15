import "./App.css"; // Импорт стилей
import React, { useRef, useEffect, useState } from 'react';

interface Ball {
    x: number;
    y: number;
    radius: number;
    color: string;
    velocityX: number;
    velocityY: number;
}

const BilliardsGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [balls, setBalls] = useState<Ball[]>([]);
    const [selectedBallIndex, setSelectedBallIndex] = useState<number | null>(null);
    const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
    const [mouseDownCoords, setMouseDownCoords] = useState<{ x: number; y: number } | null>(null);
    const [selectedColor, setSelectedColor] = useState<string>(''); // Цвет выбранного шара

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        balls.forEach(ball => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = ball.color;
            ctx.fill();
            ctx.closePath();
        });
    }, [balls]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const colors = ['red', 'blue', 'green', 'yellow'];
        const initialBalls: Ball[] = [];
        for (let i = 0; i < 4; i++) {
            initialBalls.push({
                x: (i + 1) * 100,
                y: 100,
                radius: 20 + i * 5,
                color: colors[i],
                velocityX: 0,
                velocityY: 0,
            });
        }
        setBalls(initialBalls);
    }, []);

    const handleColorChange = (color: string) => {
        if (selectedBallIndex !== null) {
            setBalls(prevBalls =>
                prevBalls.map((ball, index) =>
                    index === selectedBallIndex ? { ...ball, color } : ball
                )
            );
        }
    };

    const handleMouseDown: React.MouseEventHandler<HTMLCanvasElement> = (event) => {
        setIsMouseDown(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        setMouseDownCoords({ x: mouseX, y: mouseY });

        for (let i = 0; i < balls.length; i++) {
            const ball = balls[i];
            const dx = ball.x - mouseX;
            const dy = ball.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= ball.radius) {
                setSelectedBallIndex(i);
                break;
            }
        }
    };

    const handleMouseMove: React.MouseEventHandler<HTMLCanvasElement> = (event) => {
        if (isMouseDown && selectedBallIndex !== null && mouseDownCoords) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const dx = mouseX - mouseDownCoords.x;
            const dy = mouseY - mouseDownCoords.y;

            setBalls(prevBalls =>
                prevBalls.map((ball, index) =>
                    index === selectedBallIndex
                        ? { ...ball, velocityX: dx / 10, velocityY: dy / 10 }
                        : ball
                )
            );
        }
    };

    const handleMouseUp = () => {
        setIsMouseDown(false);
        setMouseDownCoords(null);
    };

    const handleCollisions = (ball: Ball, index: number) => {
        let updatedBall = { ...ball };

        if (updatedBall.y - updatedBall.radius <= 0 || updatedBall.y + updatedBall.radius >= canvasRef.current!.height) {
            updatedBall.velocityY = -updatedBall.velocityY;
        }

        if (updatedBall.x - updatedBall.radius <= 0 || updatedBall.x + updatedBall.radius >= canvasRef.current!.width) {
            updatedBall.velocityX = -updatedBall.velocityX;
        }

        balls.forEach((otherBall, otherIndex) => {
            if (otherIndex !== index) {
                const dx = otherBall.x - updatedBall.x;
                const dy = otherBall.y - updatedBall.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= updatedBall.radius + otherBall.radius) {
                    const angle = Math.atan2(dy, dx);
                    const u1 = updatedBall.velocityX * Math.cos(angle) + updatedBall.velocityY * Math.sin(angle);
                    const u2 = otherBall.velocityX * Math.cos(angle) + otherBall.velocityY * Math.sin(angle);
                    const m1 = updatedBall.radius * updatedBall.radius;
                    const m2 = otherBall.radius * otherBall.radius;
                    const v1 = (u1 * (m1 - m2) + 2 * m2 * u2) / (m1 + m2);
                    const v2 = (u2 * (m2 - m1) + 2 * m1 * u1) / (m1 + m2);
                    const velocityX1 = v1 * Math.cos(angle) - updatedBall.velocityY * Math.sin(angle);
                    const velocityY1 = v1 * Math.sin(angle) + updatedBall.velocityY * Math.cos(angle);
                    const velocityX2 = v2 * Math.cos(angle) - otherBall.velocityY * Math.sin(angle);
                    const velocityY2 = v2 * Math.sin(angle) + otherBall.velocityY * Math.cos(angle);

                    updatedBall = { ...updatedBall, velocityX: velocityX1, velocityY: velocityY1 };
                    balls[otherIndex] = { ...otherBall, velocityX: velocityX2, velocityY: velocityY2 };
                }
            }
        });

        return updatedBall;
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            setBalls(prevBalls =>
                prevBalls.map((ball, index) =>
                    handleCollisions({
                        ...ball,
                        x: ball.x + ball.velocityX,
                        y: ball.y + ball.velocityY,
                        velocityX: ball.velocityX * 0.99,
                        velocityY: ball.velocityY * 0.99,
                    }, index)
                )
            );
        }, 1000 / 30);

        return () => clearInterval(intervalId);
    }, [balls]);

    return (
        <div>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ border: '1px solid black', cursor: 'pointer' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            ></canvas>
            {selectedBallIndex !== null && (
                <div>
                    <h3>Choose ball color:</h3>
                    <button onClick={() => handleColorChange('red')}>Red</button>
                    <button onClick={() => handleColorChange('blue')}>Blue</button>
                    <button onClick={() => handleColorChange('green')}>Green</button>
                    <button onClick={() => handleColorChange('yellow')}>Yellow</button>
                </div>
            )}
        </div>
    );
};

export default BilliardsGame;

