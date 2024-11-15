import { Component } from '@angular/core';
import { SocketService } from '../services/socket.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent {
  lobbyCode: string = '';
  error: string = '';

  constructor(private socketService: SocketService, private router: Router) {
    this.socketService.onError().subscribe((errorMessage) => {
      this.error = errorMessage;
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: this.error,
        confirmButtonColor: '#fea42f',
      });
    });

    this.socketService.onLobbyCreated().subscribe((lobbyCode) => {
      this.router.navigate(['/play', lobbyCode]);
    });

    this.socketService.onLobbyJoined().subscribe((lobbyCode) => {
      this.router.navigate(['/play', lobbyCode]);
    });
  }

  hostGame(): void {
    const generatedLobbyCode = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();
    Swal.fire({
      title: 'Enter your name',
      input: 'text', // Input type
      inputPlaceholder: 'Your name here',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      confirmButtonColor: '#fea42f',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to write something!';
        } else {
          return this.socketService.createLobby(generatedLobbyCode, value);
        }
      },
    });
  }

  joinGame(): void {
    if (this.lobbyCode.trim()) {
      this.socketService.joinLobby(this.lobbyCode.trim());
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Nothing was entered!',
        confirmButtonColor: '#fea42f',
      });
    }
  }
}
