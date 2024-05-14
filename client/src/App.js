import './App.css';

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css'

const socket = io('http://localhost:3001')

function App() {
    const [roomId, setRoomId] = useState(null);
    const [playerName, setPlayerName] = useState(null);

    const [joinedRoom, setJoinedRoom] = useState(false);

    const [startGame, setStartGame] = useState(false);
    const [players, setPlayers] = useState([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

    const [question, setQuestion] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState(null);
    const [answerSubmitted, setAnswerSubmitted] = useState(false);
    const [timer, setTimer] = useState(30);
    const [points, setPoints] = useState(0);
    const [bank, setBank] = useState(0);
    const [bankSubmitted, setBankSubmitted] = useState(false);
    const [round, setRound] = useState(1);

    const [kicked, setKicked] = useState(false);
    const [won, setWon] = useState(false);


    const roomIdHandler = (e) => {
        setRoomId(e.target.value);
    }
    const nameHandler = (e) => {
        setPlayerName(e.target.value);
    }
    const submitFormHandler = (e) => {
        if (roomId && playerName) {
            setJoinedRoom(true);
        }
    };

    const renderPlayersBoxes = () => {
        const playerBoxes = [];
        for (let i = 0; i < 8; ++i) {
            const player = players[i];
            playerBoxes.push(
                <div key={i} className='PlayerBox'>
                    {player ? (
                        <div className='PlayerNameBox'> {player.name}</div>
                    ) : (
                        <div className='EmptyName'> Empty slot </div>
                    )}
                </div>
            )
        }
        return playerBoxes;
    }
    const renderQuestion = (question) => {
        const submitBox = [];
        if (kicked && !startGame && won && !playerName) {
            return;
        }

        submitBox.push(
            <div className='submitBox'>
                <div className='Question'> {question} </div>

                {(playerName === players[currentPlayerIndex].name) ? (
                    <div>
                        <input required placeholder='your answer' onChange={answerHandler}/>
                        <button onClick={submitAnswerHandler} type='submit' className='AnswerButton'> submit</button>
                        <button onClick={submitBankHandler} type='submit' className='BankButton'> bank</button>
                    </div>
                ) : (
                    <div></div>
                )}

            </div>
        )
        return submitBox;
    }


    useEffect(() => {
        if (joinedRoom) {
            socket.emit('joinRoom', roomId, playerName);
        }
    }, [joinedRoom]);

    useEffect(() => {
        socket.on('message', (message) => {
            // toast(`${message}`, {
            //     position: 'top-right',
            //     autoClose: 3000,
            // })
        })
        return () => {
            socket.off('message');
        }
    }, []);

    useEffect(() => {
        socket.on('setPlayers', (players) => {
            setPlayers(players);
        });
        return ()=> {
            socket.off('setPlayers');
        }
    }, []);
    useEffect(() => {
        socket.on('setCurrentPlayerIndex', (currentPlayerIndex) => {
            setCurrentPlayerIndex(currentPlayerIndex)
        });
        return ()=> {
            socket.off('setCurrentPlayerIndex');
        }
    }, []);
    useEffect(() => {
        socket.on('setRound', (round) => {
            setRound(round);
        });
        return ()=> {
            socket.off('setRound');
        }
    }, []);


    useEffect(() => {

        socket.on('startGame', () => {
            setStartGame(true);
        });

        // socket.on('playerEliminated', (playerId) => {
        //     const newPlayers = players.filter((player) => player.id !== playerId);
        //     setPlayers(newPlayers);
        // });
        //
        // socket.on('gameOver', (winnerId) => {
        //     alert("Game over! The winner is ${winnerId}");
        // });
        return ()=> {
            socket.off('startGame');
        }
    }, [players]);



    useEffect(() => {
        if (timer === 0) {
            // nextRound

            if (!kicked && startGame && !won && playerName === players[currentPlayerIndex].name) {

                setQuestion(null);
                socket.emit('nextRound', roomId);
            }

            // if (!players) {
            //     return;
            // }
            // if (playerName === players[currentPlayerIndex].name) {
            //     setRound(prevState => prevState + 1);
            //     setQuestion(null);
            //     socket.emit('nextRound', roomId);
            // }
            return;
        }

        const interval = setInterval(() => {
            setTimer(prevState => prevState - 1);
        }, 1000);

        return () => {
            clearInterval(interval);
        }
    }, [timer]);


    useEffect(() => {
        socket.on('setTimer', (roundTime) => {
            setTimer(roundTime);
        });
        return ()=> {
            socket.off('setTimer');
        }
    }, []);
    useEffect(() => {
        socket.on('setPoints', (points) => {
            setPoints(points);
        });
        return ()=>{
            socket.off('setPoints');
        }
    }, []);
    useEffect(() => {
        socket.on('setBank', (bank) => {
            setBank(bank);
        });
        return ()=>{
            socket.off('setBank');
        }
    }, []);


    useEffect(() => {
        socket.on('nextQuestion', (question, questionIndex) => {

            setQuestion(question);
            setQuestionIndex(questionIndex);
            setAnswer(null);
            setAnswerSubmitted(false);
        })
        return ()=> {
            socket.off('nextQuestion');
        }
    }, [round]);

    useEffect(() => {
        if (answerSubmitted) {
            if (playerName === players[currentPlayerIndex].name) {
                socket.emit('checkAnswer', roomId, currentPlayerIndex, questionIndex, answer);
            }
        }
    }, [answerSubmitted, currentPlayerIndex, questionIndex]);

    useEffect(() => {
        if (bankSubmitted) {
            if (playerName === players[currentPlayerIndex].name) {
                socket.emit('bank', roomId);
            }
        }
    }, [bankSubmitted]);

    useEffect(() => {
        socket.on('kickTheWeakest', (roomId) => {
            setKicked(true);
        })
        return ()=>{
            socket.off('kickTheWeakest')
        }
    }, [players]);
    useEffect(() => {
        socket.on('won', () => {
            setWon(true);
        })
        return ()=>{
            socket.off('won')
        }
    }, []);


    const answerHandler = (e) => {
        setAnswer(e.target.value);
    }
    const submitAnswerHandler = (e) => {
        if (answer) {
            setAnswerSubmitted(true);
        }
    };

    const submitBankHandler = (e) => {
        setBankSubmitted(true);
    };




    return (
        <div className='App'>
            {!joinedRoom ? (
                <div className='JoinRoom'>
                    <h1> The Weakest Link </h1>

                    <form onSubmit={submitFormHandler}>
                        <input required placeholder='Room ID' onChange={roomIdHandler}/>
                        <input required placeholder='Name' onChange={nameHandler}/>
                        <button type='submit' className='JoinButton'> join</button>
                    </form>

                </div>
            ) : (
                <div className='Quiz'>
                    <div className='container'>
                        <div className='left-column'>
                            <div className='PlayersBoxes'>
                                {renderPlayersBoxes()}
                            </div>
                        </div>
                        <div className='right-column'>
                            <div className='Title'> The Weakest Link </div>
                            <div className='RoomId'> Room ID: {roomId} </div>
                            <div className='PlayerName'> Name: {playerName} </div>
                            {/*<ToastContainer />*/}

                            <div className='StartGame'>
                                {startGame ? (
                                    <div className='Game'>
                                        <div className='Round'> Round: {round}</div>
                                        <div className='Points'> points: {points} </div>
                                        <div className='Bank'> bank: {bank} </div>

                                        <div className='KickOrNot'>
                                            {!kicked ? (
                                                <div className='WinOrNot'>
                                                    {!won ? (
                                                        <div className='Question'>
                                                            <div className='Timer'> Time remaining: {timer} </div>
                                                            {renderQuestion(question)}
                                                        </div>
                                                        ) : (
                                                        <div className='YouWon'> You won {bank} points bank! </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className='YouLost'> You lost! </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className='WaitingPlayers'> Waiting players </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
