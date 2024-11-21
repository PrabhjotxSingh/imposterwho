import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // Backend server URL
  }

  createLobby(username: string) {
    this.socket.emit('createLobby', username);
  }

  onLobbyCreated(callback: (lobbyCode: string) => void) {
    this.socket.on('onLobbyCreated', callback);
  }

  onSendError(callback: (error: string) => void) {
    this.socket.on('onSendError', callback);
  }
}
