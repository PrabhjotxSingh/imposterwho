import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../services/socket.service';
import Swal from 'sweetalert2';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrl: './play.component.css',
})
export class PlayComponent implements OnInit, OnDestroy {
  lobbySubscription: Subscription = new Subscription();
  players: any[] = [];
  lobbyCode: any = '';
  lobbyContent: any;

  constructor(
    private socketService: SocketService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.socketService.checkPlayerStatus();

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

    this.lobbySubscription.add(
      this.socketService.lobbyUpdated$.subscribe((data) => {
        if (data) {
          this.lobbyCode = data.lobbyCode;
          this.lobbyContent = data.lobby;
          this.players = Object.values(this.lobbyContent.players);

          // Check player before starting
          if (this.players.length < 3) {
            Swal.fire({
              title: 'Waiting for Players',
              html: `Waiting for more players to join...<br>(${this.players.length}/3 joined)<br />Send <b>${this.lobbyCode}</b> to your friends!</b>`,
              icon: 'info',
              allowOutsideClick: false,
              showConfirmButton: false,
            });
          } else {
            Swal.close();
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.lobbySubscription.unsubscribe();
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
        this.router.navigate(['']);
      }
    });
  }
}
