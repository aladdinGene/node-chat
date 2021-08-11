const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs")
const fs = require('fs');
const path = require('path');

var bodyParser = require('body-parser');
var multer = require('multer');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
// mysql connection

const mysql = require('mysql');
const host = 'localhost';
const user = 'oleh';
const password = 'chat2021O.';
const database = 'bootstrap';
const con = mysql.createConnection({
  host,
  user,
  password,
  database,
});
con.connect();
const saltRounds = 10

const storage = multer.diskStorage({
  destination(req, file, cb) {
    var upload_path = `upload/${req.body.path}`
    var temp_chat_path = 'upload/chat'
    if(!fs.existsSync(temp_chat_path)){
      fs.mkdir(temp_chat_path, function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log("New directory successfully created.")
        }
      })
    }
    if(!fs.existsSync(upload_path)){
      fs.mkdir(upload_path, function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log("New directory successfully created.")
        }
      })
    }
    cb(null, upload_path);
  },
  filename(req, file, cb) {
    console.log(req.body)
    // const { paperId, filesize } = req.body;
    // let paId = 0;
    // let faId = 0;
    // if (paperId !== undefined && filesize !== undefined) {
    //   paId = paperId[0];
    //   faId = filesize[filesize.length - 1];
    // }
    const filename = `${Date.now()}-${file.originalname}`;

    // fileUploads(files, filename, paId, faId);
    cb(null, filename);
  }
});

var upload = multer({storage: storage}); // for parsing multipart/form-data

router.post("/getUserInfoById",  async (req, res) => {
  const query1 = "select * from users where u_email = '" + req.body.user.userEmail + "'";

  await con.query(query1, (err, result, fields) => {
    if (err) throw err;
    if (result.length) {
      res.json({
        flag: true,
        data: result[0],
      })
      res.send();
    } else {
      res.json({
        flag: false,
        data: [],
      })
      res.send();
    }
  });
});

router.get("/signin",  async (req, res) => {
  // res.send('Hello World!')
  res.render('signin', {
    subject: 'EJS template engine',
    name: 'our template',
    link: 'https://google.com'
  });
});

router.get("/signup",  async (req, res) => {
  // res.send('Hello World!')
  res.render('signup', {
    subject: 'EJS template engine',
    name: 'our template',
    link: 'https://google.com'
  });
});
// ================user sign up api
router.post("/signup", upload.single('image'), async (req, res) => {
  console.log(req.file, req.body)
  var avatar_column = ""
  var avatar_value = ""
  if(req.file){
    let { filename, mimetype, size } = req.file;
    let filepath = path.normalize(req.file.path);
    avatar_column = ", u_avatar"
    avatar_value = "', '" + filepath.replace(/\\/g, '/')
    console.log(filename, mimetype, size, filepath, avatar_value)
  }


  var userEmail = req.body.email;
  var userPwd = req.body.pwd;
  var userFirstName = req.body.firstName;
  var userLastName = req.body.lastName;
  var userMobile = req.body.mobile;

  const query1 = "select * from users where u_email = '" + userEmail + "'";

  console.log("userSign up")
  var flag = false
  res.setHeader('Content-Type', 'text/html');
  await con.query(query1, (err, result, fields) => {
    if (err) throw err;
    if (result.length) {
      flag = true
      res.json({
        flag: false,
        data: "",
        msg: "Email or UserName Already Exist!"
      })
      res.send();
      
    } else {
      bcrypt.genSalt(saltRounds, function (err, salt) {
        if (err) {
          throw err
        } else {
          bcrypt.hash(userPwd, salt, function (err, hash) {
            if (err) {
              throw err
            } else {
              //$2a$10$FEBywZh8u9M0Cec/0mWep.1kXrwKeiWDba6tdKvDfEBjyePJnDT7K
              const query1 = `INSERT INTO users (u_firstname, u_lastname, u_email, u_pwd, u_mobile${avatar_column}) VALUES ('` + userFirstName + "', '" + userLastName + "', '" + userEmail + "', '" + hash + "', '" + userMobile + avatar_value + "'); ";
              con.query(query1, (err, result, fields) => {
                if (err) throw err;
                res.json({
                  flag: true,
                  data: {
                    userEmail: userEmail,
                    token: hash
                  },
                  msg: "Contratulation! Sign Up is Success"
                })
                res.send();
              });
            }
          })
        }
      })
    }
  });
});

router.post("/signin", async (req, res) => {
  var userEmail = req.body.email;
  var userPwd = req.body.pwd;
  console.log(req.body);
  const query1 = "select * from users where u_email = '" + userEmail + "'";
  res.setHeader('Content-Type', 'text/html');
  await con.query(query1, (err, result, fields) => {
    if (err) throw err;
    if (result.length) {
      bcrypt.compare(userPwd, result[0].u_pwd, function(err, isMatch) {
        if (err) {
          throw err
        } else if (!isMatch) {
          res.status(400).json({
            flag: false,
            data: "",
            msg: "Email or Password is incorrect!"
          })
          res.send();
        } else {
          req.session.user = result[0];
          // res.redirect('/');
          res.status(200).json({
            flag: true,
            data: result[0],
            msg: "Login Success!"
          });
          res.send();
        }
      })
    } else {
      res.json({
        flag: false,
        data: "",
        msg: "Email or Password is incorrect!"
      })
      res.send();
    }
  });
});

function checkSignIn(req, res, next){
   if(req.session.user){
      next();     //If session exists, proceed to page
   } else {
      var err = new Error("Not logged in!");
      next(err);  //Error, trying to access unauthorized page!
   }
}

router.get("/", checkSignIn,  async (req, res) => {
  // res.send('Hello World!')
  // var query = "SELECT * FROM users WHERE id <> " + req.session.user.id
  var query = `SELECT * FROM (SELECT * FROM users WHERE id <> ${req.session.user.id}) a LEFT JOIN 
              (SELECT r.user_id, r.group_id, m.kind, m.content, m.created_at FROM chat_recipient r 
              LEFT JOIN chat_message m ON r.group_id = m.group_id AND m.id IN (SELECT MAX(id) AS id FROM chat_message GROUP BY group_id) 
              WHERE r.group_id IN (SELECT group_id FROM chat_recipient WHERE user_id=${req.session.user.id}) AND r.user_id<>${req.session.user.id} 
              ORDER BY IFNULL(created_at, "2500-01-01 00:00:00.000000") DESC) b 
              ON a.id=b.user_id`
  console.log("return data")
  con.query(query, (err, result) => {
    if (err) throw err;
    res.render('index', {
      user: req.session.user,
      members: result
    });
  });
  
});

router.get('/logout', function(req, res){
  req.session.destroy(function(){
    console.log("user logged out.")
  });
  res.redirect('/signin');
});

router.use('/', function(err, req, res, next){
  // console.log(err);
   //User should be authenticated! Redirect him to log in.
   res.redirect('/signin');
});

router.post('/fetch_messages', async(req, res) => {
  var group_id = req.body.group_id
  var query = `SELECT * FROM chat_message WHERE group_id=${group_id}`
  await con.query(query, (err, result, fields) => {
    if (err) throw err;
    res.status(200).json({
      messages: result
    })
  })
})

router.post("/chat_file", upload.single('image'), async (req, res) => {
  if(req.file){
    let { filename, mimetype, size } = req.file;
    let filepath = path.normalize(req.file.path).replace(/\\/g, '/');
    res.status(200).json({
      flag: true,
      filename,
      mimetype,
      size,
      filepath
    })
    res.send();
  }

});

router.post("/add_new_group", async (req, res) => {
  var users = JSON.parse(req.body.users)
  console.log(users, req.body.users)
  var d = new Date()
  var group_id = d.valueOf()
  users.map(async (user) => {
    var query = `INSERT INTO chat_recipient (user_id, group_id) VALUES ('${user}', '${group_id}');`;
    await con.query(query, (err, result, fields) => {
      if(err) throw err;
    })
  })
  res.status(200).json({
    group_id,
    users,
    created: true
  })
  res.send();
})

router.post("/fetch_new_user", async (req, res) => {
  var id = req.body.id
  var query = `SELECT * FROM users WHERE id=${id}`
  await con.query(query, (err, result, fields) => {
    if(err) throw err;
    res.status(200).json({
      status: true,
      data: result
    })
    res.send()
  })
})

module.exports = router;