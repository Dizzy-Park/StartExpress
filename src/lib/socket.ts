import { io, Socket } from "socket.io-client";
import config from "../config/config";

const socket: Socket = io(config.url.soketApi, {
  autoConnect: false,
});

export const connect: () => void = async () => {
  socket.connect();
  socket.on("connected", id => {
    socket.emit("type", "client");
  });
  socket.on("gettoken", () => {
    socket.emit("token", config.token);
  });
};

export const disconnect: () => void = async () => {
  socket.disconnect();
};

export default socket;
