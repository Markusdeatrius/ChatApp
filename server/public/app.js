const socket = io('ws://localhost:3500');

const activity = document.querySelector('.activity');
const msgInput = document.querySelector('#message');
const nameInput = document.querySelector('#name');
const chatRoom = document.querySelector('#room');
const usersList = document.querySelector('.user-list');
const chatDisplay = document.querySelector('.chat-display');


function sendMessage(e){
    e.preventDefault()
    
    if(nameInput.value && msgInput.value && chatRoom.value){
        socket.emit('message', {
            name: nameInput.value,
            text: msgInput.value
        })
        msgInput.value = "";
    }
    msgInput.focus()
};

function enterRoom(e){
    e.preventDefault()
    if(nameInput.value && chatRoom.value){
        socket.emit('enterRoom', {
            name: nameInput.value,
            room: chatRoom.value
        })

    }
}


document.querySelector('.form-msg')
    .addEventListener('submit', sendMessage)

document.querySelector('.form-join')
    .addEventListener('submit', enterRoom)

msgInput.addEventListener('keypress', () => {
    socket.emit('activity', nameInput.value)
})

//Listen for msg
socket.on("message", (data) => {
    activity.textContent = "";
    const { name, text, time } = data
    const li = document.createElement('li')
    li.className = 'post'
    document.querySelector('ul').appendChild(li)
})



let activityTimer
socket.on("activity", (name) => {
    activity.textContent = `${name} is typing...`

    //Clear afte 3sec
    clearTimeout(activityTimer)
    activityTimer = setTimeout(() => {
        activity.textContent = ""
    }, 3000)
})