import { useRef, useEffect, useLayoutEffect } from 'react';
import './index.module.css'
import { useDispatch, useSelector } from 'react-redux';
import { MENU_ITEMS } from '@/constants';
import { actionItemClick } from '@/slice/menuSlice';
import { socket } from '@/socket';

const Board = () => {
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const drawHistory = useRef([]);
  const historyPointer = useRef(0);
  const { activeMenuItem, actionMenuItem } = useSelector((state) => state.menu);
  const { color, size } = useSelector((state) => state.toolbox[activeMenuItem]);
  const shouldDraw = useRef(false);

  useLayoutEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight


    context.fillStyle = "#ffffff";

    const beginPath = (x, y) => {
      context.beginPath();
      context.moveTo(x, y);
    }
    const drawLine = (x, y) => {
      context.lineTo(x, y);
      context.stroke();
    };

    const handleMouseDown = (e) => {
      shouldDraw.current = true;
      beginPath(e.clientX, e.clientY);
      socket.emit("beginPath", { x: e.clientX, y: e.clientY });
    };
    const handleMouseDraw = (e) => {
      if (!shouldDraw.current) return
      drawLine(e.clientX, e.clientY);
      socket.emit("drawLine", { x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => {
      shouldDraw.current = false;
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      drawHistory.current.push(imageData);
      historyPointer.current = drawHistory.current.length - 1;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseDraw);
    canvas.addEventListener('mouseup', handleMouseUp);

    socket.on("beginPath", (arg) => beginPath(arg.x, arg.y));
    socket.on("drawLine", (arg) => drawLine(arg.x, arg.y));
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseDraw);
      canvas.removeEventListener('mouseup', handleMouseUp);

      socket.off("beginPath", (arg) => beginPath(arg.x, arg.y));
      socket.off("drawLine", (arg) => drawLine(arg.x, arg.y));
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (actionMenuItem === MENU_ITEMS.DOWNLOAD) {
      const URL = canvas.toDataURL();
      const anchor = document.createElement('a');
      anchor.href = URL;
      anchor.download = 'drawing.jpg';
      anchor.click();
    } else if (actionMenuItem === MENU_ITEMS.UNDO || actionMenuItem === MENU_ITEMS.REDO) {
      if (historyPointer.current > 0 && actionMenuItem === MENU_ITEMS.UNDO) historyPointer.current -= 1
      if (historyPointer.current < drawHistory.current.length - 1 && actionMenuItem === MENU_ITEMS.REDO) historyPointer.current += 1
      const imageData = drawHistory.current[historyPointer.current]
      context.putImageData(imageData, 0, 0)
    }

    dispatch(actionItemClick(null));
  }, [actionMenuItem, dispatch]);

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const changeConfig = (color, size) => {
      context.strokeStyle = color;
      context.lineWidth = size;
    }
    changeConfig(color, size);
    const handleChangeConfig = (arg) => {
      console.log("sss", arg);
    }

    socket.on("changeConfig", (arg) => changeConfig(arg.color, arg.size)
    );

    return () => {
      socket.off('changeConfig', (arg) => changeConfig(arg.color, arg.size));
    }
  }, [color, size]);

  return (
    <canvas ref={canvasRef}></canvas>

  )
}

export default Board;