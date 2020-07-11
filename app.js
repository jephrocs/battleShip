const express = require('express')
const socket = require('socket.io')
const chalk = require('chalk')
const app = express()
const uuidv4 = require('uuid/v4')
const PORT = process.env.PORT || 3000

// plrs in rm
let numberOfPlayers = 0
const shipPresets = [
    ['b9', 'c9', 'd9', 'e9', 'f9', 'd3', 'd4', 'd5', 'd6', 'g5', 'h5', 'i5', 'f2', 'g2', 'h2', 'j2', 'j3'],
    ['a1', 'b1', 'c1', 'd1', 'e1', 'e3', 'e4', 'e5', 'e6', 'g6', 'h6', 'i6', 'f2', 'g2', 'h2', 'j4', 'j5'],
    ['b3', 'c3', 'd3', 'j10', 'j9', 'j8', 'j7', 'j6', 'b9', 'c9', 'd9', 'g2', 'g3', 'g4', 'g5', 'i3', 'j3'],
    ['j5', 'i5', 'e6', 'e7', 'e8', 'e9', 'e10', 'a1', 'b1', 'c1', 'd1', 'b5', 'b6', 'b7', 'h10', 'h9', 'h8'],
    ['b1', 'c1', 'd1', 'e1', 'f1', 'j10', 'j9', 'a6', 'a7', 'a8', 'e4', 'e5', 'e6', 'c9', 'd9', 'e9', 'f9'],
    ['a1', 'a2', 'c1', 'c2', 'c3', 'f10', 'f9', 'f8', 'f7', 'f6', 'h5', 'h6', 'h7', 'a6', 'b6', 'c6', 'd6'],
    ["a1", "a2", "a3", "c2", "c3", "c4", "c5", "c6", "f4", "f5", "f6", "a10", "b10", "c10", "d10", "i4", "i5"],
    ["c4", "d4", "g2", "g3", "g4", "g5", "g6", "a8", "b8", "c8", "j5", "j6", "j7", "c10", "d10", "e10", "f10"],
    ["e4", "e5", "b8", "d8", "c8", "j2", "j3", "j4", "j5", "a2", "b2", "c2", "h4", "h5", "h6", "h7", "h8"],
    ["d5", "d6", "d7", "g1", "g2", "g3", "g4", "b10", "c10", "j7", "i7", "h7", "g7", "f7", "a2", "a3", "a4"],
    ["i1", "j1", "a10", "b10", "c10", "d10", "e10", "b4", "b5", "b6", "f2", "f3", "f4", "h9", "h8", "h7", "h6"],
    ["b1", "c1", "d1", "e1", "e10", "f10", "g10", "h10", "i10", "d4", "d5", "d6", "j1", "j2", "j3", "a9", "b9"],
    ["j4", "j5", "a4", "b4", "c4", "f1", "f2", "f3", "f4", "h10", "h9", "h8", "h7", "h6", "a9", "b9", "c9"],
    ["e3", "f3", "c3", "c4", "c5", "d7", "e7", "f7", "g7", "g1", "h1", "i1", "j1", "f1", "a10", "b10", "c10"],
    ["j2", "i2", "a8", "c8", "b8", "a3", "b3", "c3", "f10", "f9", "f8", "f7", "e1", "e2", "e3", "e4", "e5"],
    ["b1", "b2", "d3", "d4", "d5", "a7", "b7", "c7", "d7", "i3", "i2", "i1", "g10", "g9", "g8", "g7", "g6"],
    ["a6", "b6", "c6", "f3", "f4", "f5", "f6", "d9", "e9", "f9", "g9", "h9", "j1", "j2", "j3", "b2", "b3"],
    ["e5", "f5", "b4", "b5", "b6", "b7", "i3", "i4", "i5", "i6", "i7", "c10", "d10", "e10", "f1", "f2", "f3"],
    ["a5", "b5", "g5", "g6", "g7", "e2", "e3", "e4", "b10", "c10", "d10", "e10", "a8", "b8", "c8", "d8", "e8"],
    ["d5", "e5", "b4", "b5", "b6", "b7", "b8", "e8", "f8", "g8", "g2", "h2", "i2", "i5", "i6", "i7", "i8"],
    ["a1", "b1", "c1", "d6", "d7", "d8", "e3", "f3", "g3", "h3", "a4", "a5", "a6", "a7", "a8", "j7", "i7"],
    ["a2", "a3", "e3", "e4", "e5", "e9", "f9", "g9", "i2", "i3", "i4", "i5", "c7", "d7", "e7", "f7", "g7"]
]

// Serve public folder .
app.use(express.static("./app/public"))

// Parse application body as JSON.
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Start server and store value in 'server' for use with Socket.io.
const server = app.listen(PORT, function () {
    console.log(chalk.blue(`Listening on PORT: ${PORT}`))
})

// Socket.io configuration.
const io = socket(server)

// Stores individual players game state.
// Revise into a constructor => constructor key needs to be tracked to identify players
// This my solve my bug with multiple games running at once.
const players = [{
    playerNumber: undefined,
    playerName: undefined,
    isTurn: true,
    ships: [],
    moves: [],
    health: 17
}, {
    playerNumber: undefined,
    playerName: undefined,
    isTurn: false,
    ships: [],
    moves: [],
    health: 17
}]

// Express route selects random ships array from shipPresets and serves to client
app.get('/randomShips', function (req, res) {
    const arrValue = shipPresets[Math.floor(Math.random() * shipPresets.length)]
    res.send(arrValue)
})

// Recieves an array of ship locations from client => includes a player identiy => sets this players ship locations
// Server error 503
app.post('/setShips', function (req, res) {
    const foundPlayer = players.find(function (element) {
        return element.playerName === req.body.playerName
    })
    foundPlayer.ships = req.body.myShipLoc
    res.end()
})

// Functions takes player name from client and sets players[0] or players[1] name to this determined by order players join room
// First players into room is players[0] => second is players[1]
setName = (name) => {
    if (players[0].playerName === undefined) {
        players[0].playerName = name
        players[0].playerNumber = numberOfPlayers
        numberOfPlayers++
    } else {
        players[1].playerName = name
        players[1].playerNumber = numberOfPlayers
    }
    players.forEach((player) => console.log(player))
}

// Socket handlers that get initiated upon connection to socket.
io.on('connection', function (socket) {
    console.log(chalk.green('socket connection success'))

    // Serves UUID to client that's generated for each client upon connection to default socket.
    app.get('/code', function (req, res) {
        res.send(uuidv4())
    })

    // Join room handler.  Creates or joins a room with UUID from client.
    socket.on('joinRoom', function ({ roomId, playerName }) {
        socket.join(roomId)
        setName(playerName)
    })

    // Message handler. Emits message & senderName to all clients in room.
    socket.on('sendMessage', function ({ room, message, playerName }) {
        io.to(room).emit('newMessage', { room, message, playerName })
    })

    // Function determines result of game turn. Finds the object of the player who iniated turn then by process of elimiation 
    // checks the opponets (object) property 'ships' (ship locations) => if 'ships' includes grid cordinate returns true else false
    // Clunky code needs to be refactored. Could be a hidden bug here but program appears to work as intended.
    function checkHit(space, name) {
        const result = players.find(function (player) {
            return player.playerName === name
        })
        if (result.playerNumber === 0) {
            const result = players[1].ships.includes(space)
            if (result) {
                players[1].health--
            }
            else {
                players[0].isTurn ? players[0].isTurn = false : players[0].isTurn = true
                players[1].isTurn ? players[1].isTurn = false : players[1].isTurn = true
            }
            return result
        } else {
            const result = players[0].ships.includes(space)
            if (result) {
                players[0].health--
            }
            else {
                players[0].isTurn ? players[0].isTurn = false : players[0].isTurn = true
                players[1].isTurn ? players[1].isTurn = false : players[1].isTurn = true
            }
            return result
        }
    }

    // Game turn handler.  Checks if it's currently this clients turn.  Passes cordinate and player name to checkHit function.
    // Takes turn o false return value and sends it to all clients inside of room with {cordinate, T/F, clientID}
    // Boths clients will use this data to determine how to affect the css.
    socket.on('turn', function ({ space, room, name }) {
        const playerObj = players.find(function (element) {
            return element.playerName === name
        })

        if (playerObj.isTurn === false) {
            return
        } else {
            const validMove = playerObj.moves.includes(space)
            if (!validMove) {
                const result = checkHit(space, name)
                io.to(room).emit('turnResult', { space, result, name })
                playerObj.moves.push(space)
                console.log(players[0], players[1])
                // check game state here
            } else {
                console.log(players[0], players[1])
            }
        }
    })

    // game result handler.
    socket.on('checkWin', function (room) {
        players.forEach((player) => {
            if (player.health === 0) {
                io.to(room).emit('gameResult', player)
                players[0].isTurn = false
                players[1].isTurn = false
            }
        })
    })

    // game state handler.
    socket.on('gameState', function (room) {
        let state
        const shipOne = players[0].ships.length
        const shipTwo = players[1].ships.length

            if (shipOne === 0 || shipTwo === 0) {
                state = 'set ships'
            } else if (players[0].isTurn === true) {
                state = `${players[0].playerName}'s turn.`
            } else if (players[1].isTurn === true) {
                state = `${players[1].playerName}'s turn`
            }
        io.to(room).emit('gameState', state)
    })
})


