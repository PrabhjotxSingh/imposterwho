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
  playersData: any = {};
  lobbyCode: any = '';
  lobbyContent: any;
  currentRound: number = 1;
  currentGame: number = 1;
  currentCategory: string = 'None yet';
  actionButton: string = '???';
  allPrepDone: boolean = false;
  canSendMessages: boolean = false;
  message: string = '';
  currentResponses: any = {};
  timer: number = 30;
  private timerInterval: any;

  constructor(
    public socketService: SocketService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.socketService.onGuessFeedback(
      (feedback: { remainingGuesses: number }) => {
        Swal.fire({
          title: 'Guess Incorrect',
          text: `You have ${feedback.remainingGuesses} guesses left.`,
          icon: 'warning',
          confirmButtonColor: '#fea42f',
          confirmButtonText: 'OK',
        });
      }
    );

    this.socketService.onGameOver(
      (data: { result: string; message: string }) => {
        Swal.fire({
          title: 'Game Over',
          text: data.message,
          confirmButtonColor: '#fea42f',
          confirmButtonText: 'OK',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          const isHost =
            this.lobbyContent.host[this.socketService.socketId] !== undefined;

          if (isHost) {
            Swal.fire({
              title: 'Start New Game',
              text: 'Would you like to start a new game?',
              icon: 'question',
              showCancelButton: true,
              confirmButtonColor: '#fea42f',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Yes, Start New Game',
              cancelButtonText: 'No',
              allowOutsideClick: false,
              allowEscapeKey: false,
            }).then((result) => {
              if (result.isConfirmed) {
                this.startNewGame();
              } else {
                this.router.navigate(['']).then(() => {
                  window.location.reload();
                });
              }
            });
          } else {
            Swal.fire({
              title: 'Awaiting Host',
              text: 'Please wait while host decides to start a new game.',
              showConfirmButton: false,
              allowOutsideClick: false,
              allowEscapeKey: false,
            });
          }
        });
      }
    );

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
          this.playersData = Object.entries(
            this.lobbyContent.players as Record<string, { name: string }>
          ).map(([socketId, playerData]) => ({
            socketId,
            name: playerData.name,
          }));
          this.currentRound = this.lobbyContent.game.currentRound;
          this.currentGame = this.lobbyContent.game.currentGame;
          this.allPrepDone = this.lobbyContent.game.allPrepDone;
          this.canSendMessages = this.lobbyContent.game.canSendMessages;
          this.currentResponses = this.lobbyContent.game.responses;

          console.log(this.lobbyContent);

          if (this.lobbyContent.game.isActive == false) {
            if (this.players.length < 3) {
              Swal.fire({
                title: 'Waiting for Players',
                html: `Waiting for more players to join...<br>(${this.players.length}/3 joined)<br />Send <b>${this.lobbyCode}</b> to your friends!</b>`,
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                allowEscapeKey: false,
              });
            } else {
              const isHost =
                this.lobbyContent.host[this.socketService.socketId];

              if (isHost) {
                Swal.fire({
                  title: 'Start the Game',
                  html: `The minimum of three players have joined the lobby. Click <b>Start Game</b> to begin or wait for more!`,
                  icon: 'success',
                  showConfirmButton: true,
                  confirmButtonText: 'Start Game',
                  allowOutsideClick: false,
                  allowEscapeKey: false,
                  confirmButtonColor: '#fea42f',
                }).then((result) => {
                  if (result.isConfirmed) {
                    this.startGame();
                  }
                });
              } else {
                Swal.fire({
                  title: 'Waiting for Host',
                  html: `The game is ready to start! Waiting for the host to begin...`,
                  icon: 'info',
                  allowOutsideClick: false,
                  showConfirmButton: false,
                  allowEscapeKey: false,
                });
              }
            }
          } else if (this.lobbyContent.game.isActive == true) {
            // Game has started, close all Swal popups
            Swal.close();

            // Game logic here

            // Reset category

            this.currentCategory = 'None yet';

            // Display player type message
            if (this.lobbyContent.game.allPrepDone == false) {
              if (
                this.lobbyContent.game.chosenPlayer ===
                this.socketService.socketId
              ) {
                this.actionButton = 'Vote';
                Swal.fire({
                  title: 'You are the category picker!',
                  text: `Please enter your category before time runs out.`,
                  input: 'text',
                  inputPlaceholder: 'Enter your category...',
                  showCancelButton: false,
                  confirmButtonText: 'Submit',
                  confirmButtonColor: '#fea42f',
                  timer: 30000,
                  timerProgressBar: true,
                  allowOutsideClick: false,
                  allowEscapeKey: false,
                  backdrop: false,
                  inputValidator: (value) => {
                    if (!value || value.trim() === '') {
                      return 'You need to write something!';
                    }
                    return null;
                  },
                }).then((result) => {
                  if (result.isConfirmed) {
                    console.log('Category submitted:', result.value);
                    this.submitCategory(result.value);
                  } else if (result.dismiss === Swal.DismissReason.timer) {
                    console.log('Timer ran out. Sending empty category.');
                    this.submitCategory('');
                  }
                });
              } else if (
                this.lobbyContent.game.imposter === this.socketService.socketId
              ) {
                this.actionButton = 'Guess';
                Swal.fire({
                  title: 'You are the imposter!',
                  text: `Please wait while the category picker decides. Also don't tell anyone you are the imposter.`,
                  showConfirmButton: false,
                  timer: 30000,
                  timerProgressBar: true,
                  allowOutsideClick: false,
                  allowEscapeKey: false,
                  backdrop: false,
                });
              } else {
                this.actionButton = 'Vote';
                Swal.fire({
                  title: 'You are a player!',
                  text: `Please wait while the category picker decides.`,
                  showConfirmButton: false,
                  timer: 30000,
                  timerProgressBar: true,
                  allowOutsideClick: false,
                  allowEscapeKey: false,
                  backdrop: false,
                });
              }
            } else {
              if (
                this.lobbyContent.game.imposter === this.socketService.socketId
              ) {
                this.currentCategory = 'You are the imposter';
              } else {
                this.currentCategory = this.lobbyContent.game.category;
              }
              if (this.lobbyContent.game.isActive && !this.timerInterval) {
                this.startTimer(30);
              }
            }
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.lobbySubscription.unsubscribe();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
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

  sendMessage(): void {
    if (this.message.trim() !== '') {
      this.socketService.submitMessage(this.message, this.lobbyCode);
      this.message = '';
    } else {
      this.showErrorAlert(
        'Empty Message',
        'You can not send an empty message.'
      );
    }
  }
  startGame() {
    this.socketService.startGame(this.lobbyCode);
  }

  submitCategory(value: string | null) {
    this.socketService.submitCategory(value, this.lobbyCode);
  }

  startTimer(duration: number) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timer = duration;
    this.timerInterval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }, 1000);
  }

  actionButtonClick() {
    if (this.lobbyContent.game.imposter === this.socketService.socketId) {
      if (this.allPrepDone && this.lobbyContent.game.isActive) {
        Swal.fire({
          title: 'Guess the Category',
          input: 'text',
          inputPlaceholder: 'Enter your guess...',
          showCancelButton: false,
          confirmButtonText: 'Submit Guess',
          confirmButtonColor: '#fea42f',
          allowOutsideClick: false,
          allowEscapeKey: false,
          timerProgressBar: true,
          inputValidator: (value) => {
            if (!value || value.trim() === '') {
              return 'You need to write something!';
            }
            return null;
          },
        }).then((result) => {
          if (result.isConfirmed) {
            this.socketService.submitGuess(result.value, this.lobbyCode);
          }
        });
      }
    } else {
      if (this.allPrepDone && this.lobbyContent.game.isActive) {
        const playerNames = this.players
          .filter((player) => player.socketId !== this.socketService.socketId)
          .map((player) => player.name);

        Swal.fire({
          title: 'Vote for the Imposter',
          input: 'select',
          inputOptions: playerNames.reduce((options, name, index) => {
            options[index] = name;
            return options;
          }, {}),
          inputPlaceholder: 'Select a player',
          confirmButtonText: 'Submit Vote',
          confirmButtonColor: '#fea42f',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showCancelButton: false,
          inputValidator: (value) => {
            if (value === null || value === undefined || value.trim() === '') {
              return 'You need to select someone!';
            }
            return null;
          },
        }).then((result) => {
          if (result.isConfirmed) {
            const votedPlayerIndex = parseInt(result.value, 10);
            const votedPlayerSocketId = this.players[votedPlayerIndex].socketId;
            this.socketService.submitVote(votedPlayerSocketId, this.lobbyCode);
            Swal.fire({
              title: 'Vote Submitted',
              text: `You voted for ${this.players[votedPlayerIndex].name}.`,
              icon: 'info',
              confirmButtonColor: '#fea42f',
              confirmButtonText: 'OK',
            });
          }
        });
      } else {
        Swal.fire({
          title: 'Not Ready to Vote',
          text: 'You can only vote after the preparation is done and the round is active.',
          icon: 'warning',
          confirmButtonColor: '#fea42f',
          confirmButtonText: 'OK',
        });
      }
    }
  }

  startNewGame(): void {
    this.socketService.startNewGame(this.lobbyCode);
  }
}
