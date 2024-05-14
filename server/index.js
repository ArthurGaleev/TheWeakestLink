const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

// const cors = require('cors');
// app.use(cors());

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

const questions = [
    {
        question: 'Вопрос 1',
        answer: 'Ответ 1'
    },
    {
        question: 'Вопрос 2',
        answer: 'Ответ 2'
    },
    {
        question: 'Вопрос 3',
        answer: 'Ответ 3'
    },
    {
        question: 'Вопрос 4',
        answer: 'Ответ 4'
    },
    {
        question: 'Вопрос 5',
        answer: 'Ответ 5'
    },
    {
        question: 'Вопрос 6',
        answer: 'Ответ 6'
    },
    {
        question: 'Вопрос 7',
        answer: 'Ответ 7'
    },
    {
        question: 'Вопрос 8',
        answer: 'Ответ 8'
    },
    {
        question: 'Вопрос 9',
        answer: 'Ответ 9'
    },
    {
        question: 'Вопрос 10',
        answer: 'Ответ 10'
    },
    {
        question: 'Вопрос 11',
        answer: 'Ответ 11'
    },
    {
        question: 'Вопрос 12',
        answer: 'Ответ 12'
    },
];


const nextRound = (roomId) => {
    if (!rooms[roomId]) {
        return;
    }
    console.log(rooms[roomId].roundTime);

    if (rooms[roomId].roundCount !== 1) {
        rooms[roomId].currentPoints = 0;
        rooms[roomId].roundTime -= 10;
        kickTheWeakest(roomId);
    }

    if (rooms[roomId].players.length === 1) {
        const totalBank = rooms[roomId].bank;
        io.sockets.sockets.get(rooms[roomId].players[0].id).emit('won');
        return;
        // io.sockets.sockets.get(rooms[roomId].players[0].id).emit(
        //     'message', `You won the bank of ${totalBank} points!`
        // );
    }

    io.to(roomId).emit('setCurrentPlayerIndex', 0);
    io.to(roomId).emit('setRound', rooms[roomId].roundCount);
    io.to(roomId).emit('setTimer', rooms[roomId].roundTime);

    const questionIndex = rooms[roomId].questionIndex;
    io.to(roomId).emit('nextQuestion', questions[questionIndex].question, questionIndex);

    ++rooms[roomId].roundCount;
};

const kickTheWeakest = (roomId) => {
    if (!rooms[roomId] || !rooms[roomId].players) {
        return;
    }

    let sorted = [].sort.call(rooms[roomId].players, function (a, b) {
        let a_val = a.totalAnswers ? (a.correctAnswers / a.totalAnswers) : 1;
        let b_val = b.totalAnswers ? (b.correctAnswers / b.totalAnswers) : 1;
        // let a_val = a.correctAnswers / a.totalAnswers;
        // let b_val = b.correctAnswers / b.totalAnswers;
        if (a_val > b_val) { return 1 }
        else if (a_val < b_val) { return -1 }
        else return 0;
    });
    let playerToKick = sorted[0];


    let playerToKickIndex = rooms[roomId].players.indexOf(playerToKick);
    if (!playerToKick) {
        playerToKickIndex = 0;
        playerToKick = rooms[roomId].players[0];
    }

    console.log('kick:', playerToKick, 'room:', rooms[roomId].players);

    rooms[roomId].players.splice(playerToKickIndex, 1);

    console.log('room2:', rooms[roomId].players);

    io.to(roomId).emit('setPlayers', rooms[roomId].players)

    io.sockets.sockets.get(playerToKick.id).emit('kickTheWeakest', playerToKickIndex);
    io.sockets.sockets.get(playerToKick.id).emit('message', 'You lost!');
}

const playerAnswers = {};
const rooms = {};



io.on('connection', (socket) => {
    console.log(`user connected:`, socket.id);

    socket.on('joinRoom', (roomId, playerName) => {
        console.log(roomId, playerName);
        socket.join(roomId);

        socket.broadcast.to(roomId).emit('message', `${playerName} has connected`)

        if (!rooms[roomId]) {
            rooms[roomId] = {
                players: [],
                questionIndex: 0,
                currentPoints: 0,
                bank: 0,
                roundTime: 40,
                roundCount: 1,
            }
        }

        rooms[roomId].players.push({ id: socket.id, name: playerName, correctAnswers: 0, totalAnswers: 0 });

        io.to(roomId).emit('setPlayers', rooms[roomId].players)
        console.log(rooms[roomId].players);
        if (rooms[roomId].players.length === 4) {
            io.to(roomId).emit('startGame');
            nextRound(roomId)
        }
    });

    socket.on('nextRound', (roomId) => {
        nextRound(roomId);
    });


    socket.on('checkAnswer', (roomId, currentPlayerIndex, questionIndex, answer) => {
        if (!rooms[roomId]) {
            return;
        }

        console.log('AnswerCheck:', answer, questionIndex)

        rooms[roomId].players[currentPlayerIndex].totalAnswers += 1;
        if (answer === questions[questionIndex].answer) {
            rooms[roomId].players[currentPlayerIndex].correctAnswers += 1;
            if (rooms[roomId].currentPoints) {
                rooms[roomId].currentPoints *= 2
            } else {
                rooms[roomId].currentPoints = 100;
            }
        } else {
            rooms[roomId].currentPoints = 0;
        }
        io.to(roomId).emit('setPoints', rooms[roomId].currentPoints);

        ++rooms[roomId].questionIndex;
        questionIndex = rooms[roomId].questionIndex;
        console.log(questionIndex);

        ++currentPlayerIndex;
        if (currentPlayerIndex === rooms[roomId].players.length) {
            currentPlayerIndex = 0;
        }
        console.log('cp:', currentPlayerIndex);
        io.to(roomId).emit('setCurrentPlayerIndex', currentPlayerIndex);

        io.to(roomId).emit('nextQuestion', questions[questionIndex].question, questionIndex);
    });

    // socket.on('kickTheWeakest', (roomId) => {
    //
    // });

    socket.on('bank', (roomId) => {
        rooms[roomId].bank += rooms[roomId].currentPoints;
        rooms[roomId].currentPoints = 0;
        io.to(roomId).emit('setPoints', 0);
        io.to(roomId).emit('setBank', rooms[roomId].bank);
    });


    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            rooms[roomId].players = rooms[roomId].players.filter(
                (playerName) => playerName.id !== socket.id
            );
        }

        console.log(`user disconnected:`, socket.id)
    });
});

server.listen(3001, () => {
    console.log(`Server is running on port ${3001}`);
});
