import './App.css';

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001')

function App() {
    const [roomId, setRoomId] = useState(null);
    const [playerName, setPlayerName] = useState(null);

    const [joinedRoom, setJoinedRoom] = useState(false);
    const [ready, setReady] = useState(false);

    const [startGame, setStartGame] = useState(false);
    const [players, setPlayers] = useState([]);


    const roomIdHandler = (e) => {
        setRoomId(e.target.value);
    }
    const nameHandler = (e) => {
        setPlayerName(e.target.value);
    }
    const submitHandler = (e) => {
        // e.preventDefault()

        if (roomId && playerName) {
            setJoinedRoom(true);
        }
    };

    const renderPlayersBoxes = () => {
        const playerBoxes = [];
        for (let i = 0; i < players.length; ++i) {
            const player = players[i];
            playerBoxes.push(
                <div key={player.id} className='PlayerBox'>
                    {player ? (
                        <div>{player.name}</div>
                    ) : (
                        <div> Empty slot </div>
                    )}
                </div>
            )
        }
        return playerBoxes;
    }

    const waitPlayers = () => {
    }

    useEffect(() => {
        if (joinedRoom) {
            socket.emit('JoinRoom', roomId, playerName);
        }
    }, [joinedRoom]);




    return (
        <div className='App'>
            {!joinedRoom ? (
                <div className='JoinRoom'>
                    <h1> The Weakest Link </h1>

                    <form onSubmit={submitHandler}>
                        <input required placeholder='Room ID' onChange={roomIdHandler}/>
                        <input required placeholder='Name' onChange={nameHandler}/>

                        <button type='submit' className='JoinButton'> join </button>
                    </form>

                </div>
            ) : (
                <div className='Quiz'>
                    <div className='PlayersBoxes'>
                        {renderPlayersBoxes()}
                    </div>

                    {!startGame ? (
                        waitPlayers()
                    ) : (
                        <h1> The Weakest Link </h1>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
