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
  lobbyCode = 'test';

  constructor(private socketService: SocketService, private router: Router) {}

  ngOnInit(): void {}

  setUsername() {}

  hostGame() {}
}
