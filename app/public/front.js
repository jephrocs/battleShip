// set-up a connection between the client and the server
const socket = io.connect('https://gentle-coast-61798.herokuapp.com/')
const newGameButton = document.getElementById('new-game')
const joinButton = document.getElementById('join')

// Pulling the value of this HTML element upon initiation of client could be causing unexpected behavior.
// Strange messages are leaking to default room yet game moves are not

let roomId = document.getElementById('room-code')
const test = document.getElementById('test')
const message = document.getElementById('message')
let playerName = document.getElementById('player-name')
const chatMessage = document.getElementById('scroll-box')
const randomShips = document.getElementById('random-ships')
const myGrid = document.querySelectorAll('.my-grid')
let myShipLoc
const setShips = document.getElementById('set-ships')
const gameState = document.getElementById('game-state')

// Iniate game state checker
const checkState = (roomId) => {
    socket.emit('gameState', roomId)
}

// Random ship generator.  Sets background color of all clients playing board to blue, makes an axios request to server which returns an 
// array of ship cordinates.  Loops through each cordinate and changes the correlating grid space to gray to visually represent ship locations.
randomShips.addEventListener('click', function () {
    myGrid.forEach(function (element) {
        element.style.backgroundColor = '#0198E1'
    })
    axios.get('/randomShips').then(resp => {
        myShipLoc = resp.data
        console.log(myShipLoc)
        resp.data.forEach(function (element) {
            document.getElementById(`m${element}`).style.backgroundColor = '#696969'
        })
    })
})

// Set ship handler fires when user settles on desired ship configuration.  Client makes an axios POST to server with an array of ship cordinates
// and their name so the server can set the values to the correct player object.
setShips.addEventListener('click', function () {
    axios.post('/setShips', {
        myShipLoc,
        playerName
    })
        .then(function (response) {
            console.log(response)
            checkState(roomId)
        })
        .catch(function (error) {
            console.log(error.response)
        })

    randomShips.style.display = 'none'
    setShips.style.display = 'none'
    
})

// Client makes axios GET request. Returns a UUID user can use to create or join a socket room.
newGameButton.addEventListener('click', function () {
    axios.get('/code').then(resp => {
        document.getElementById('display').textContent = resp.data
    })
})

// Sends UUID & playerName to server to either create or join a socket room.
joinButton.addEventListener('click', function () {
    roomId = roomId.value
    playerName = playerName.value
    socket.emit('joinRoom', {
        roomId,
        playerName: playerName
    })
    joinButton.style.display = 'none'
    gameState.textContent = 'set ships'
})

// Sends {message, roomId, playerName} to server to emit message to all clients within socket room where 'room name' is roomId
// Currently not working as intended
test.addEventListener('click', function () {
    console.log('roomid, message.value, playerName')
    console.log(roomId, message.value, playerName)
    socket.emit('sendMessage', {
        room: roomId,
        message: message.value,
        playerName: playerName
    })
    message.value = ''
})

// Room message handler.  Recieves a message from server and dislays sender name and message to dom.
// Currently all clients connected to default socket recieves these messages.
socket.on('newMessage', function ({ message, playerName, room }) {
    console.log(message, playerName, room)
    chatMessage.innerHTML += `<div class="ml-2">${playerName}: ${message}<div>`
})

// Game turn handler.  Uses grid cordinate, player who iniated turn, and result of turn to affect the visual reponsation of the game via game boards.
socket.on('turnResult', function ({ space, result, name }) {

    if (name === playerName) {
        if (result) {
            document.getElementById(space).style.backgroundColor = 'red'
        } else {
            document.getElementById(space).style.backgroundColor = 'white'
        }
    } else {
        if (result) {
            document.getElementById(`m${space}`).style.backgroundColor = 'red'
        } else {
            document.getElementById(`m${space}`).style.backgroundColor = 'white'
        }
    }

    // Fires a function on the backend to check for a win.
    socket.emit('checkWin', roomId)
})

// Query to select clients grid that represents his opponenets board.
const gridSpace = document.querySelectorAll('.grid-space')


// Game Turn. Sends turns to back end to run game logic and return result. Sends {roomId, cordinate, playerName}
gridSpace.forEach(function (element) {
    element.addEventListener('click', function () {

            socket.emit('turn', {
                space: this.id,
                room: roomId,
                name: playerName
            })
            checkState(roomId)

    })

})

// Game result handler
socket.on('gameResult', function (player) {
    if (player.playerName === playerName) {
        gameState.textContent = 'you lost'
    } else {
        gameState.textContent = 'you won'
    }
})



// Game state handler.
socket.on('gameState', function (state) {
    gameState.textContent = state
})

   message.addEventListener('keyup', function(event) {
       if (event.keyCode === 13) {
           event.preventDefault()
           document.getElementById('test').click()
       }
   })