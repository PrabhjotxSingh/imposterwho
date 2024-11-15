import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrl: './play.component.css',
})
export class PlayComponent {
  lobbyCode: string = '';
  message: string = '';
  messages: { sender: string; message: string }[] = [];
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.lobbyCode = this.route.snapshot.paramMap.get('lobbyCode') || '';

    this.socketService.onMessageReceived().subscribe((data) => {
      this.messages.push(data);
    });

    this.socketService.onCreatorDisconnected().subscribe((message) => {
      this.errorMessage = message;
      alert('The lobby creator has left. Returning to selection screen.');
      this.router.navigate(['']);
    });

    this.socketService.onReturnToSelection().subscribe(() => {
      alert('Returning to selection screen.');
      this.router.navigate(['']);
    });
  }

  sendMessage(): void {
    if (this.message.trim()) {
      this.socketService.sendMessage(this.lobbyCode, this.message.trim());
      this.message = '';
    }
  }
}
