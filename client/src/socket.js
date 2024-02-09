import { io } from "socket.io-client";
const URL = 'https://react-sketcher-server.onrender.com/';
export const socket = io(URL);