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
  username = '';

  private adjectives = [
    'Smart',
    'Fast',
    'Clever',
    'Brave',
    'Cool',
    'Happy',
    'Mighty',
    'Swift',
    'Bold',
    'Fierce',
    'Lucky',
    'Noble',
    'Kind',
    'Witty',
    'Charming',
    'Gentle',
    'Strong',
    'Loyal',
    'Fearless',
    'Shy',
    'Wise',
    'Quick',
    'Quiet',
    'Lively',
    'Sneaky',
    'Jolly',
    'Cheerful',
    'Bright',
    'Calm',
    'Daring',
    'Playful',
    'Friendly',
    'Zany',
    'Epic',
    'Bubbly',
    'Eager',
    'Bold',
    'Serious',
    'Sleepy',
    'Wild',
    'Energetic',
    'Adventurous',
    'Generous',
    'Bold',
    'Majestic',
    'Gallant',
    'Smiling',
    'Dreamy',
    'Grumpy',
    'Joyful',
    'Eloquent',
    'Fluffy',
    'Speedy',
    'Crafty',
    'Radiant',
    'Dynamic',
    'Feisty',
    'Giddy',
    'Heroic',
    'Magical',
    'Resourceful',
    'Humble',
    'Spunky',
    'Practical',
    'Savvy',
    'Sunny',
  ];

  private nouns = [
    'Pirate',
    'Cow',
    'Tiger',
    'Ninja',
    'Eagle',
    'Dragon',
    'Knight',
    'Panther',
    'Wolf',
    'Hawk',
    'Fox',
    'Lion',
    'Bear',
    'Dolphin',
    'Falcon',
    'Shark',
    'Cheetah',
    'Whale',
    'Phoenix',
    'Gryphon',
    'Unicorn',
    'Wizard',
    'Goblin',
    'Elf',
    'Orc',
    'Samurai',
    'Robot',
    'Alien',
    'Bunny',
    'Duck',
    'Raven',
    'Sparrow',
    'Panda',
    'Otter',
    'Hedgehog',
    'Lemur',
    'Sloth',
    'Octopus',
    'Turtle',
    'Puffin',
    'Chipmunk',
    'Kangaroo',
    'Zebra',
    'Moose',
    'Narwhal',
    'Frog',
    'Lizard',
    'Crab',
    'Viper',
    'Gecko',
    'Bat',
    'Penguin',
    'Snail',
    'Mantis',
    'Beetle',
    'Rhino',
    'Koala',
    'Chameleon',
    'Llama',
    'Giraffe',
    'Jaguar',
    'Cobra',
    'Parrot',
    'Walrus',
    'Peacock',
    'Ferret',
    'Platypus',
  ];

  constructor(private socketService: SocketService, private router: Router) {}

  ngOnInit(): void {
    this.socketService.onSendError((errorMessage: string) => {
      this.showErrorAlert('Unknown Error', errorMessage);
    });

    this.generateRandomUsername();
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

  generateRandomUsername() {
    const randomAdjective =
      this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
    const randomNoun =
      this.nouns[Math.floor(Math.random() * this.nouns.length)];
    this.username = `${randomAdjective}${randomNoun}`;
  }

  joinGame() {
    this.lobbyCode = this.lobbyCode.toUpperCase().trim();
    this.username = this.username.trim();
    if (!this.username) {
      this.showErrorAlert('No Username', 'You need an username to play silly!');
      return;
    }
    this.socketService.joinLobby(this.username, this.lobbyCode);
    this.socketService.onLobbyJoined((lobbyCode: string) => {
      this.showAlertAndRedirect(
        'Start Game',
        `Your game is ready to go! Your have joined lobby <b>${lobbyCode}</b>.`
      );
    });
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
