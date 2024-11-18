import { Component, OnInit } from '@angular/core';
import { SocketService } from '../services/socket.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent implements OnInit {
  username: string | null = '';
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
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
    });
  }

  ngOnInit(): void {
    this.username = localStorage.getItem('username');
    if (this.username == null || this.username == '') {
      this.setUsername();
    }

    this.socketService.lobbyCreated().subscribe((data) => {
      console.log('Lobby Created:', data);
    });
  }

  setUsername() {
    Swal.fire({
      title: 'Enter your username',
      input: 'text',
      inputPlaceholder: 'Type your name here...',
      showCancelButton: false,
      confirmButtonText: 'Submit',
      confirmButtonColor: '#fea42f',
      allowEscapeKey: false,
      allowOutsideClick: false,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to write something!';
        }
        return null;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.setItem('username', result.value);
        Swal.fire({
          title: 'Username saved!',
          text: `Your username has been set as ${result.value}. You can change this anytime by pressing change username on the welcome screen.`,
          confirmButtonColor: '#fea42f',
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then(() => {
          location.reload();
        });
      }
    });
  }

  hostGame() {
    if (this.username) {
      this.socketService.createLobby(this.username);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong! Hard refresh and try again!',
        confirmButtonColor: '#fea42f',
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
    }
  }
}
