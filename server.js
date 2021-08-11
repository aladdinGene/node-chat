const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const PORT = 4000;
const router = require('./router/router');
const session = require('express-session');
const APIKEY ="longman0512asdwds3210";
var connectedUsers = {};

app.use(session({
  secret: "1234567890qwertyuiop",
  resave: true,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, '/')));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === 'OPTIONS') {
      res.header("Access-Control-Allow-Methods", "PUT, POST, DELETE, GET");
      return res.status(200).json({});
  }
  next();
});
app.use(router);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('assets'));
// Ididn't use it now why I don't knwo how to use it I don't know too haha  but you must use multer to upload files to express
//setup server Then Can I send string to express using formdata? yes, you can send form data and recieve it on node.js backend.
// one second
const server = app.listen(PORT, function() {
  console.log("server running: "+PORT);
});

const io = require("socket.io")(server, {
  cors: {
    origin: '*',
  }
}); // socket setup
var connectCounter = 0;

io.on("connection", function(socket) {

  socket.on('auth', ({apikey, id}, callback)=>{
    if(apikey == APIKEY) {
      socket.emit("joined", "You joined.")
      socket['user_id'] = id
      getData(socket, id)
      connectedUsers[id] = {
          'id': socket.id,
          'user_id': id,
          'socket': socket
        }
      console.log(`${id} is joined`)
    }
  })

  socket.on('disconnect', ()=>{
    disconnected(socket)
  })


  socket.on("Add", function(data) {
    addData(socket, data)
  });

  socket.on("typing_send", function(data) {
    typing_send(socket, data)
  });

  socket.on("chat_want", function(data) {
    chat_want(socket, data)
  })
});




// mysql connection
const mysql = require('mysql');
const host = 'localhost';
const user = 'oleh';
const password = 'chat2021O.';
const database = 'bootstrap';
const con = mysql.createConnection({
  host, user, password, database,
});
con.connect();


const getData = async (socket, id) => {
  var query1 = "UPDATE users SET online='1' WHERE id='" + id + "'"
  con.query(query1, (err1, result1) => {
    if (err1) throw err1;
    socket.broadcast.emit("isOline", {id:id})
  });
};

const disconnected = (socket) => {
  console.log('user is disconnected', socket.user_id)
  var user_id = socket.user_id
  delete connectedUsers[socket.user_id]
  var query1 = "UPDATE users SET online='0' WHERE id='" + user_id + "'"
  con.query(query1, (err1, result1) => {
    if (err1) throw err1;
    socket.broadcast.emit("isOffline", {id:user_id})
  });
}

const addData = async (socket, data) => {
  var d = new Date()
  var created_at = d.toISOString()
  var query = "INSERT INTO chat_message (user_id, group_id, kind, content, created_at) VALUES ('" + data.user_id + "', '"+ data.to +"', '"+ data.kind + "', '"+ data.content + "', '"+ created_at +"')";
  // var query = "INSERT INTO data (name, price, res_name) VALUES ('" + data.name + "', '"+data.price+"', '"+data.res_name+"')";
  var updated = ''
  await con.query(query, async (err, result, fields) => {
    if (err) throw err;
    query = `SELECT user_id FROM chat_recipient WHERE group_id=${data.to} AND user_id<>${data.user_id}`
    await con.query(query, async (err1, result1, fields1) => {
      if (err1) throw err1;
      result1.map((member) => {
        var temp_socket = connectedUsers[member.user_id]['socket']
        temp_socket.emit("message_added",
          {
            added: true,
            id: result.insertId,
            content: data.content,
            kind: data.kind,
            created_at,
            user_id: data.user_id,
            room: data.to,
            created_at
          });
      })

      socket.emit("message_added",
        {
          added: true,
          id: result.insertId,
          content: data.content,
          kind: data.kind,
          created_at,
          user_id: data.user_id,
          room: data.to,
          created_at
        });
    })
  });
};

const typing_send = async (socket, data) => {
  var query = `SELECT user_id FROM chat_recipient WHERE group_id=${data.room} AND user_id<>${data.user_id}`
  await con.query(query, async (err1, result1, fields1) => {
    if (err1) throw err1;
    result1.map((member) => {
      var temp_socket = connectedUsers[member.user_id]['socket']
      temp_socket.emit("typing_receive",
        {
          typing: data.started,
          user_id: data.user_id,
          room: data.room
        });
    })
  })
}

const chat_want = async (socket, data) => {
  connectedUsers[data.to]['socket'].emit('chat_added', data)
}