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
  createLobby(name: string): void {
    this.socket.emit('createLobby', name);
  }

  lobbyCreated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('lobbyCreated', (data) => {
        observer.next(data);
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
}
