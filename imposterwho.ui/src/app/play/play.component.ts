import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../services/socket.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrl: './play.component.css',
})
export class PlayComponent {
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
        this.router.navigate(['']);
      }
    });
  }

  constructor(private socketService: SocketService, private router: Router) {
    this.socketService.onLobbyClosed((error: string) => {
      this.showAlertAndRedirect('Host Quit', error);
    });

    this.socketService.onPlayerLeft(
      (data: { lobbyCode: string; players: any }) => {
        this.showErrorAlert(
          'Player Left',
          `A player has left the lobby ${data.lobbyCode}. `
        );
      }
    );

    this.socketService.onSendError((errorMessage: string) => {
      this.showAlertAndRedirect('Unknown Error', errorMessage);
    });
  }

  ngOnInit(): void {
    this.socketService.checkPlayerStatus();
  }
}
