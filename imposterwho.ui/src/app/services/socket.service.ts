import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  private lobbyUpdatedSubject = new BehaviorSubject<{
    lobbyCode: any;
    lobby: any;
  } | null>(null);

  constructor() {
    this.socket = io('http://localhost:3000');
    this.registerSocketListeners();
  }

  private registerSocketListeners(): void {
    this.socket.on('onLobbyUpdated', (lobbyCode: any, lobby: any) => {
      this.lobbyUpdatedSubject.next({ lobbyCode, lobby });
    });
  }

  get lobbyUpdated$() {
    return this.lobbyUpdatedSubject.asObservable();
  }

  createLobby(username: string) {
    this.socket.emit('createLobby', username);
  }

  joinLobby(username: string, lobbyCode: string) {
    this.socket.emit('joinLobby', username, lobbyCode);
  }

  checkPlayerStatus() {
    this.socket.emit('checkPlayerStatus');
  }

  onLobbyCreated(callback: (lobbyCode: string) => void) {
    this.socket.on('onLobbyCreated', callback);
  }

  onLobbyJoined(callback: (lobbyCode: string) => void) {
    this.socket.on('onLobbyJoined', callback);
  }

  onSendError(callback: (error: string) => void) {
    this.socket.on('onSendError', callback);
  }

  onLobbyClosed(callback: (error: string) => void) {
    this.socket.on('onLobbyClosed', callback);
  }

  onPlayerLeft(callback: (data: { lobbyCode: string; players: any }) => void) {
    this.socket.on('onPlayerLeft', callback);
  }
}
