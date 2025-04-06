import express from 'express'
import { Server } from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500;
const ADMIN = "Admin"

const app = express()

app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT,  () => {
    console.log(`listening on port ${PORT}`)
})

//state
const usersState = {
    users: [],
    setUsers: function(newUsersArray){
        this.users = newUsersArray
    }
}

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false :["http://localhost:5500", "http://127.0.0.1:5500"] 
    }
})

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`)

    //Only to user
    socket.emit('message', buildMsg(ADMIN, "Welcome to Chat app!"))

     socket.on('enterRoom', ({ name, room}) => {
        //leave
        const prevRoom = getUser(socket.id)?.room

        if(prevRoom) {
            socket.leave(prevRoom)
            io,to(prevRoom).emit('message', buildMsg(ADMIN, `${name} has left the room`))
        }

        const user = activateUser(socket.id, name, room)

        if(prevRoom){
            io.to(prevRoom).emit('userList', {
            users: getUserInRoom(prevRoom)
        })}

        socket.join(user.room)

        socket.emit('message', buildMsg(ADMIN, `You have joined the ${user.name} to ${user.room} chat room`))

        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined`))

        io.to(user.room).emit('userList', {
            users: getUserInRoom(user.room)
        })

        io.emit('roomList', {
            room: getAllActiveRooms()
        })
    })



    //User disconnect - others
    socket.on('disconnected', () => {
        const user = getUser(socket.id)
        userLeavesApp(socket.id)

        if (user) {
            io.to(user.room).emit('message', buildMsg(ADMIN, ` ${user.name} Left the room`))

            io.to(user.room).emit('userList',{
                users: getUserInRoom(user.room)
            })

            io.emit('roomList', {
                rooms: getAllActiveRooms()
            })
        }
        console.log(`User ${socket.id} disconnected`)
    })

    socket.on('message', ({ name, text}) =>{
        const room = getUser(socket.id)?.room
        if (room) {
            io.to(room).emit('message', buildMsg(name, text))
        }
    })

    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room

        if(room) {
            socket.broadcast.to(room).emit('activity', name)
        }
    })
})

function buildMsg(name, text){
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }).format(new Date())
    }
}

function activateUser(id, name, room){
    const user = {id, name, room}
    usersState.setUsers([
        ...usersState.users.filter(user => user.id !== id),
        user
    ])
    return user;
}

function userLeavesApp(id){
    usersState.setUsers(
        usersState.users.filter(user => user.id !== id)
    )
}

function getUser(id){
    return usersState.users.find(user => user.id === id)
}

function getUserInRoom(room){
    return usersState.users.filter(user => user.room === room)
}

function getAllActiveRooms() {
    return Array.from(new Set(usersState.users.map(user => user.room)))
}