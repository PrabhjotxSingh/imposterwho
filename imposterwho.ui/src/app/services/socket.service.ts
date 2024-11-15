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

  // Emit events
  createLobby(lobbyCode: string, name: string): void {
    this.socket.emit('createLobby', lobbyCode, name);
  }

  joinLobby(lobbyCode: string): void {
    this.socket.emit('joinLobby', lobbyCode);
  }

  sendMessage(lobbyCode: string, message: string): void {
    this.socket.emit('sendMessage', { lobbyName: lobbyCode, message });
  }

  // Listen to events
  onMessageReceived(): Observable<{ sender: string; message: string }> {
    return new Observable((observer) => {
      this.socket.on('receiveMessage', (data) => {
        observer.next(data);
      });
    });
  }

  onLobbyCreated(): Observable<string> {
    return new Observable((observer) => {
      this.socket.on('lobbyCreated', (lobbyCode) => {
        observer.next(lobbyCode);
      });
    });
  }

  onLobbyJoined(): Observable<string> {
    return new Observable((observer) => {
      this.socket.on('lobbyJoined', (lobbyCode) => {
        observer.next(lobbyCode);
      });
    });
  }

  onError(): Observable<string> {
    return new Observable((observer) => {
      this.socket.on('error', (errorMessage) => {
        observer.next(errorMessage);
      });
    });
  }

  onCreatorDisconnected(): Observable<string> {
    return new Observable((observer) => {
      this.socket.on('creatorDisconnected', (message) => {
        observer.next(message);
      });
    });
  }

  onReturnToSelection(): Observable<void> {
    return new Observable((observer) => {
      this.socket.on('returnToSelection', () => {
        observer.next();
      });
    });
  }
}
