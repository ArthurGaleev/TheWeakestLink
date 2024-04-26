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
];



let questionIndex = 0;
const playerAnswers = {};
const rooms = {};

io.on('connection', (socket) => {
    console.log(`user connected:`, socket.id);

    socket.on('joinRoom', (roomId, playerName) => {
        socket.join(roomId);

        io.to(roomId).emit('message', `${playerName} has connected`)

        if (!rooms[roomId]) {
            rooms[roomId] = {
                players: [],
                currentQuestion: '',
                currentPoints: 0,
                bank: 0,
                roundTime: 90,
            }
        }

        rooms[roomId].players.push({ id: socket.id, name: playerName });
    });

    socket.on('startGame', (roomId) => {
        if (rooms[roomId].players.length === 8) {
            io.emit('startGame', rooms[roomId].players);
        }
    })


    socket.on('answer', ({ roomId, questionIndex, answer }) => {
        if (answer === questions[questionIndex].answer) {
            if (rooms[roomId].currentPoints) {
                rooms[roomId].currentPoints *= 2
            } else {
                rooms[roomId].currentPoints = 100;
            }
        } else {
            rooms[roomId].currentPoints = 0;
        }
    });

    socket.on('bank', (roomId) => {
        rooms[roomId].bank += rooms[roomId].currentPoints;
        rooms[roomId].currentPoints = 0;
    });


    socket.on('disconnect', () => {
        console.log(`user disconnected:`, socket.id)
    });
});

const nextQuestion = () => {
    if (questionIndex < questions.length) {
        io.emit('question', questions[questionIndex]);
        questionIndex++;
    } else {
        io.emit('gameOver', playerAnswers);
    }
};

server.listen(3001, () => {
    console.log(`Server is running on port ${3001}`);
});
