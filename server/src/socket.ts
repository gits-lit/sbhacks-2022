import { Server, Socket } from "socket.io";
import { randomInteger, uuid } from "./utils";

const LIMIT = 6;

class Player {
    playerID: string;
    name: string;
    photo: string;
    score: number;

    constructor(name: string) {
        this.playerID = uuid(4);
        this.name = name;
        this.photo = `icon-${randomInteger(1, 6)}.svg`;
        this.score = 0;
    }
}

class Question {
    question: string;
    answerA: string;
    answerB: string;
    answerC: string;
    answerD: string;
    correct: "A" | "B" | "C" | "D";

    constructor(question: string, answerA: string, answerB: string, answerC: string, answerD: string, correct: "A" | "B" | "C" | "D") {
        this.question = question;
        this.answerA = answerA;
        this.answerB = answerB;
        this.answerC = answerC;
        this.answerD = answerD;
        this.correct = correct;
    }

    public getPublicQuestion = () => {
        return { question: this.question, answerA: this.answerA, answerB: this.answerB, answerC: this.answerC, answerD: this.answerD };
    }

    public getQuestionAnswer = () => {
        return { correct: this.correct };
    }
}

class Guess {
    playerID: string;
    guess: "A" | "B" | "C" | "D";

    constructor(playerID: string, guess: "A" | "B" | "C" | "D") {
        this.playerID = playerID;
        this.guess = guess;
    }
}

class Game {
    gameID: string;
    players: Player[];
    active: boolean;
    questions: Question[];
    questionNumber: number;
    questionTotal: number;
    currentQuestion: Question;
    guesses: Guess[];
    timeoutID: NodeJS.Timeout;

    constructor(questions: any[]) {
        this.gameID = uuid(4);
        this.players = [];
        this.active = false;
        this.questions = questions.map((q) => (new Question(q.question, q.a, q.b, q.c, q.d, q.answer)));
        this.questionNumber = 0;
        this.currentQuestion = null;
        this.guesses = [];
        this.timeoutID = null;

        if (!questions) {
            this.questions = [
                new Question("What is the first letter of the alphabet?", "A", "B", "C", "D", "A"),
                new Question("What is the fourth number of the numberbet?", "1", "2", "3", "4", "D"),
                new Question("Who's last name is Lee?", "Shirley", "Steven", "Stanley", "Faris", "C"),
            ];
        }

        this.questionTotal = this.questions.length;
    }

    public getPublicGame = () => {
        return { gameID: this.gameID, players: this.players, active: this.active };
    };
}

const games = new Map<string, Game>();

export class ConnectionHandler {
    private io: Server;
    private socket: Socket;

    constructor(io: Server, socket: Socket) {
        this.io = io;
        this.socket = socket;
    }

    // Host to Server Events

    private handleCreateGame = (questions: any) => {
        console.log("handleCreateGame");

        const game = new Game(questions);

        games.set(game.gameID, game);

        this.socket.join(game.gameID);
        this.socket.emit('gameCreated', game.getPublicGame());
    };

    private handleStartGame = (input: { gameID: string }) => {
        console.log("handleStartGame");

        if (!input || !input.gameID) {
            console.log("handleStartGame", "ERROR: missing gameID parameter")
            return;
        }

        const { gameID } = input;

        if (!games.has(gameID)) {
            console.log("handleStartGame", "ERROR: unable to find game")
            return;
        }

        const game = games.get(gameID);

        game.active = true;

        this.doQuestion(gameID);
    };

    private doQuestion = (gameID: string) => {
        console.log("doQuestion");

        if (!games.has(gameID)) {
            console.log("doQuestion", "ERROR: unable to find game")
            return;
        }

        const game = games.get(gameID);

        if (game.questions.length !== 0) {
            console.log("questionStarted");

            game.questionNumber++;

            this.io.to(gameID).emit('questionStarted', {...game.questions[0].getPublicQuestion(), questionNumber: game.questionNumber, questionTotal: game.questionTotal, playerCount: game.players.length });

            game.currentQuestion = game.questions[0];

            game.questions.splice(0, 1);
            games.set(gameID, game);
        }

        const timeoutID = setTimeout(() => {
            const game = games.get(gameID);

            for (let i = 0; i < game.guesses.length; i += 1) {
                const guess = game.guesses[i];

                const playerIdx = game.players.findIndex((player) => player.playerID === guess.playerID);

                if (playerIdx === -1) {
                    continue;
                }

                if (guess.guess === game.currentQuestion.correct) {
                    game.players[playerIdx].score += 100 * (6 - i);
                }
            }

            const question = game.currentQuestion;

            game.currentQuestion = null;
            game.guesses = [];
            games.set(gameID, game);

            this.io.to(gameID).emit('questionEnded', { ...question, questionNumber: game.questionNumber, questionTotal: game.questionTotal, playerCount: game.players.length });

            setTimeout(() => {
                this.io.to(gameID).emit('gameResults', { finished: game.questions.length === 0, question, players: game.players });

                if (game.questions.length !== 0) {
                    setTimeout(() => {
                        this.doQuestion(gameID);
                    }, 7500);
                }
            }, 7500);
        }, 10000);

        game.timeoutID = timeoutID;
        games.set(gameID, game);
    };

    private handleSkipQuestion = (input: { gameID: string }) => {
        console.log("handleSkipQuestion");

        if (!input || !input.gameID) {
            console.log("handleSkipQuestion", "ERROR: missing gameID parameter")
            return;
        }

        const { gameID } = input;

        if (!games.has(gameID)) {
            console.log("handleSkipQuestion", "ERROR: unable to find game")
            return;
        }

        const game = games.get(gameID);

        if (game.currentQuestion) {
            const question = game.currentQuestion;

            game.currentQuestion = null;
            game.guesses = [];

            games.set(gameID, game);

            this.io.to(gameID).emit('gameResults', { finished: game.questions.length === 0, question, players: game.players });
        }
    };

    // Player to Server Events

    private handleJoinGame = ({ gameID, name }: { gameID: string, name: string }) => {
        console.log("handleJoinGame");

        if (!gameID) {
            this.socket.emit('failedJoin', { message: "A gameID is required." });
            return;
        }

        if (!name) {
            this.socket.emit('failedJoin', { message: "A name is required." });
            return;
        }

        if (!games.has(gameID)) {
            this.socket.emit('failedJoin', { message: "Unable to find a game with that gameID." });
            return;
        }

        const game: Game = games.get(gameID);

        if (game.players.length >= LIMIT) {
            this.socket.emit('failedJoin', { message: "This game is full." });
            return;
        }

        if (game.active) {
            this.socket.emit('failedJoin', { message: "This game has already started." });
            return;
        }

        const player: Player = new Player(name);

        game.players.push(player);
    
        this.socket.join(gameID);
        this.socket.emit('succeededJoin', { playerID: player.playerID });
        this.io.to(gameID).emit('gameUpdated', game.getPublicGame());
    };

    private handleAnswerQuestion = ({ gameID, playerID, answer }: { gameID: string, playerID: string, answer: "A" | "B" | "C" | "D" }) => {
        console.log("handleAnswerQuestion");

        if (!gameID || !playerID || !answer) {
            console.log("handleAnswerQuestion", "ERROR: missing variable")
            return;
        }

        if (!games.has(gameID)) {
            console.log("handleAnswerQuestion", "ERROR: unable to find game")
            return;
        }
        
        const game = games.get(gameID);

        game.guesses.push(new Guess(playerID, answer));

        games.set(gameID, game);

        this.io.to(gameID).emit('questionUpdated', { answerCount: game.guesses.length });
    };

    public handleConnection = () => {

        this.socket.on('answerQuestion', this.handleAnswerQuestion);
        this.socket.on('createGame', this.handleCreateGame);
        this.socket.on('joinGame', this.handleJoinGame);
        this.socket.on('skipQuestion', this.handleSkipQuestion);
        this.socket.on('startGame', this.handleStartGame);
    
        console.log(`a user, ${this.socket.id}, connected`);
    };
}