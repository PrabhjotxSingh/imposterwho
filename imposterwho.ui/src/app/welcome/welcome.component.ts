import { Component, OnInit } from '@angular/core';
import { SocketService } from '../services/socket.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent implements OnInit {
  lobbyCode = '';
  username = 'testUser';

  constructor(private socketService: SocketService, private router: Router) {
    this.socketService.onSendError((errorMessage: string) => {
      this.showErrorAlert(
        'Unknown Error',
        `Sorry but looks like something went wrong!`
      );
    });
  }

  showErrorAlert(title: string, message: string) {
    Swal.fire({
      title: title,
      html: message,
      icon: 'error',
      confirmButtonColor: '#fea42f',
      showConfirmButton: true,
      confirmButtonText: 'OK',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  }

  showAlertAndRedirect(title: string, message: string) {
    Swal.fire({
      title: title,
      html: message,
      confirmButtonColor: '#fea42f',
      confirmButtonText: 'OK',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/play']);
      }
    });
  }

  ngOnInit(): void {}

  joinGame() {
    this.lobbyCode = this.lobbyCode.toUpperCase();
  }

  hostGame() {
    this.username = this.username.trim();
    if (!this.username) {
      this.showErrorAlert('No Username', 'You need an username to play silly!');
      return;
    }
    this.socketService.createLobby(this.username);
    this.socketService.onLobbyCreated((lobbyCode: string) => {
      this.showAlertAndRedirect(
        'Start Game',
        `Your game is ready to go! Your lobby code is <b>${lobbyCode}</b>. Share this with your friends to have them join.`
      );
    });
  }
}
