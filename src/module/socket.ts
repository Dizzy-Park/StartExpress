import { io, Socket } from 'socket.io-client';
import config from '../config/config';
import { decrypt, encript, getRandomToken } from './security';

let securityDump: string = getRandomToken();
let socket: Socket | undefined;
if (config.socket) {
  socket = io(config.socket, {
    autoConnect: false,
    transports: ['websocket'],
    auth: {
      'x-client-token': encript(securityDump),
    },
  });
}

export const connect: () => void = async () => {
  if (socket) {
    socket.connect();
    socket.on('gettoken', key => {
      if (socket && decrypt(key) === securityDump) {
        socket.emit('client:security', {
          token: config.token,
          security: config.security,
        });
      }
    });
  }
};

export const disconnect: () => void = async () => {
  if (socket) {
    socket.disconnect();
  }
};

export default socket;
