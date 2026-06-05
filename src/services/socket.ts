import { io, type Socket } from 'socket.io-client';

const SERVER_URL = (import.meta.env.VITE_SERVER_URL as string | undefined) ?? 'http://localhost:3001';

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(SERVER_URL, { autoConnect: false });
  }
  return _socket;
}

export function resetSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
