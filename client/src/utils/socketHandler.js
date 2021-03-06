import { io } from 'socket.io-client';

let SERVER_URL;

if (process.env.NODE_ENV !== 'production') {
  SERVER_URL = 'http://localhost:4000';
} else {
  SERVER_URL = 'https://quizlash.herokuapp.com/';
}

const connection = io(SERVER_URL);

// Host-Specific Commands

export const sendCreateGame = (questions) => {
  connection.emit('createGame', questions);
};

// { gameID, players: { playerID, name, photo, score }[], active }
export const listenGameCreated = (callback) => {
  connection.removeAllListeners('gameCreated');
  connection.on('gameCreated', callback);
};

// { gameID, players: { playerID, name, photo, score }[], active }
export const listenGameUpdated = (callback) => {
  connection.removeAllListeners('gameUpdated');
  connection.on('gameUpdated', callback);
};

export const sendStartGame = (gameID) => {
  connection.emit('startGame', { gameID });
};

// { answerCount }
export const listenQuestionUpdated = (callback) => {
  connection.removeAllListeners('questionUpdated');
  connection.on('questionUpdated', callback);
};

export const sendSkipQuestion = () => {
  connection.emit('skipQuestion');
};

// Player-Specific Commands

// { gameID: string, name: string }
export const sendJoinGame = (gameID, name) => {
  connection.emit('joinGame', { gameID, name });
};

// { message }
export const listenFailedJoin = (callback) => {
  connection.removeAllListeners('failedJoin');
  connection.on('failedJoin', callback);
};

// { playerID }
export const listenSucceededJoin = (callback) => {
  connection.removeAllListeners('succeededJoin');
  connection.on('succeededJoin', callback);
};

// { gameID: string, playerID: string, answer: "A" | "B" | "C" | "D" }
export const sendAnswerQuestion = (gameID, playerID, answer) => {
  connection.emit('answerQuestion', { gameID, playerID, answer });
};

// Shared Commands

// { question, answerA, answerB, answerC, answerD, questionNumber, questionTotal }
export const listenQuestionStarted = (callback) => {
  connection.removeAllListeners('questionStarted');
  connection.on('questionStarted', callback);
};

// question: { question, answerA, answerB, answerC, answerD, correct },
export const listenQuestionEnded = (callback) => {
  connection.removeAllListeners('questionEnded');
  connection.on('questionEnded', callback);
};

// { finished, answerCount, players: { playerID, name, photo, score }[] }
export const listenGameResults = (callback) => {
  connection.removeAllListeners('gameResults');
  connection.on('gameResults', callback);
};

// Testing Commands

// Listen for all events
connection.onAny((event, ...args) => {
  console.log(`got ${event}, ${JSON.stringify(args)}`);
});

// Send a custom event message
export const sendMessage = (event, args) => {
  connection.emit(event, args);
};
