// Heroku Link: https://mintdrop.herokuapp.com/
// Author: Lundeen Cahilly
// Sources: 
//  1) https://www.youtube.com/watch?v=xDYx5UdHwv0
//       Used to in the setup of this app's SQL database
//  2) https://www.codegrepper.com/code-examples/javascript/generate+random+key+javascript
//       used to generate ids for the user, items, trades, etc
//  3) https://www.youtube.com/watch?v=NuyzuNBFWxQ
//       used to see how passwords and other sensitive data should be encrypted
//  4) https://getbootstrap.com/
//      used to massively accelerate and improve front-end development
//  5) https://waelyasmina.medium.com/a-guide-into-using-handlebars-with-your-express-js-application-22b944443b65
//      really helpful to learn 'helpers' in handlebars; was used in displaying inventories, for example
//  6) https://opensea.io/
//      primarily used to make collections, but also used as a design reference
//  7) https://www.youtube.com/watch?v=TDe7DRYK8vU and https://www.section.io/engineering-education/what-are-cookies-nodejs/
//      making cookies & sessions for user login
//  8) https://coolors.co/f2e279-d1495b-e9f2eb-0081a7-8acb88-089673
//      project color palette

//--------------Setup--------------//

const express = require("express");
const session = require("express-session");
const cookieParser = require('cookie-parser');
const querystring = require('querystring');
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
app.use(express.static(__dirname));
app.use(express.urlencoded());
const axios = require("axios");
const options = {root: path.join(__dirname)}
const sqlite3 = require("sqlite3").verbose();
const { createHash } = require("crypto")
const { scriptSync, randomBytes } = require("crypto")
const handlebars = require("express-handlebars");
const { render } = require("sass");
const Handlebars = handlebars.create({
  extname: '.html',
  defaultLayout: null
})
const { databaseSetup, createItem, createCollection, createTrade, checkTrades } = require('./db-setup');
const { query } = require("express");
const { resolveSoa } = require("dns");
const { RSA_NO_PADDING } = require("constants");
const { get, request } = require("http");
app.engine('html', Handlebars.engine)
app.set('view engine', 'html')
app.set('/views')

//---------CRYPTOGRAPHY_SETUP---------//
function makeID(len) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < len; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}
function hash(input) {
  return createHash('sha256').update(input).digest('hex');
}
//---------DB_SETUP---------//
// databaseSetup()

//--------------Middleware--------------//
app.use(
  session({
  secret: 'key that signs cookie',
  resave: false,
  saveUninitialized: false
  })
);

app.use(cookieParser());

//--------------Routes--------------//
app.get("/", function (req, res) {
  let username = req.cookies.username;
  console.log(username)
  if (username != null) {
    res.render('index', {
      username:username, 
      loggedIn:true
    })
  } else {
    res.render('index', {
      username:username, 
      loggedIn:false
    })
  }
})
app.get("/db/:table", function(req,res) {
  req.params;
  var table = req.params['table']
  //open db
  const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
    if (error) return console.log(error.message);
    console.log("database connected")
  })
  db.all(`SELECT * FROM ${table}`, function(error, rows) {
    if (error) {return res.send('table not found')}
    res.json(rows)
  })
  //close db
  db.close((error) => {
    if (error) return console.log(error.message);
  })
})

app.get("/about", function (req, res) {
  let html = "/source/about.html"
  res.sendFile(html, options, function(error) {
    if (error) {res.sendStatus(404)}
  })
})
app.get("/create/user", function (req,res) {
  let html = "/source/create_user.html"
  res.sendFile(html, options, function(error) {
    if (error) {res.sendStatus(404)}
  })
})
app.post("/create/user", function (req,res) {
    req.body;
    let username = req.body["username"]
    let email = req.body["email"]
    let password = req.body["password"]
    let userID = makeID(8)
    let profilePhoto = 'https://cdn.glitch.global/c59af7b5-3457-4ad7-a609-9ba55d160e31/defaultProfilePic.png?v=1644712398289'

    let emailHash = hash(email)
    let passwordHash = hash(password)
    //OPEN database 
    const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
        if (error) return console.log(error.message);
        console.log("database connected")
    });
    //add new user to database
    //catch error if userrname is already taken
    db.all(`SELECT COUNT(*) FROM users WHERE username="${username}"`, function (error, row) {
        if (error) return console.log(error.message);
        if (row[0]['COUNT(*)'] > 0) {
            res.send('username taken')
        } else {
          db.run(`INSERT INTO users (userID, profilePhoto, username, password, email) VALUES(?,?,?,?,?)`,[userID, profilePhoto, username, passwordHash, emailHash]), (error) => {
              if (error) return console.log(error.message);
          }
          res.redirect('/')
        }
    })    
    //CLOSE database
    db.close((error) => {
        if (error) return console.log(error.message);
    })
})
app.get("/login", function (req,res) {
    let html = "/source/login.html"
    res.sendFile(html, options, function(error) {
      if (error) {res.sendStatus(404)}
    })
})
app.post("/login", function (req,res) {
  let username = req.body["username"]
  let password = hash(req.body["password"])
  //open db
  const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
    if (error) return console.log(error.message);
    console.log("database connected")
  });
  //verify login
  console.log('verify')
  db.all(`SELECT userID FROM users WHERE username="${username}" AND password="${password}"`, function (error, row) {
    if (error) return res.redirect('/');
    res.cookie("username", username, {
      maxAge: 60 * 60 * 1000,
      secure: true,
      httpOnly: true,
      sameSite: 'lax'
    })
    return res.redirect('/')
  })
  //close db
  db.close((error) => {
    if (error) return console.log(error.message);
  })
})
app.get("/logout", function (req,res) {
  res.clearCookie("username")
  return res.redirect('/')
})
app.get("/collections", function (req, res) {
  //OPEN database
  const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
    if (error) return console.log(error.message);
    console.log("database connected")
  });  
  query1 = `
  SELECT collectionID, name, releaseDate, artist, description, photo, websiteLink 
  FROM collections
  ORDER BY releaseDate DESC`
  db.all(query1, function(error, collections){
    if (error) {return res.render('collections', {dataExists:false, collectionInfo:null})}
    for (let i = 0; i < collections.length; i++) {
      let exactTime = new Date(collections[i]['releaseDate'])
      let releaseDate = exactTime.toDateString()
      collections[i]['releaseDate'] = releaseDate
    }
    let username = req.cookies.username;
    if (username != null) {
      res.render('collections', {
        username:username,
        loggedIn:true,
        dataExists:true, 
        collectionInfo:collections
      })
    } else {
      res.render('collections', {
        username:username, 
        loggedIn:false,
        dataExists:true, 
        collectionInfo:collections
      })
    }
  })
  //CLOSE database
  db.close((error) => {
    if (error) return console.log(error.message);
  })
})
app.get("/collections/:collectionID", function (req,res) {
  req.params;
  let collectionID = req.params['collectionID']
  //open db
  var db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
    if (error) return console.log(error.message);
    console.log("database connected")
  });
  //item count, items info (name, mediaLink, mediaType, itemID), collection info(name, artist(s), description, website link, photo)
  let query = `
  SELECT collections.name AS collectionName, collections.releaseDate, collections.artist, collections.description, collections.photo, collections.websiteLink, items.itemID, items.name, items.mediaType, items.mediaLink, items.mintDate
  FROM collections
  INNER JOIN items ON collections.collectionID = items.collectionID
  WHERE items.collectionID="${collectionID}"`
  db.all(query, function (error, itemInfo) {
    if (error) {return res.redirect('#')};
    for (let i = 0; i < itemInfo.length; i++) {
      let exactMintTime = new Date(itemInfo[i]['mintDate'])
      let mintDate = exactMintTime.toDateString()
      let exactReleaseTime = new Date(itemInfo[i]['releaseDate'])
      let releaseDate = exactReleaseTime.toDateString()
      itemInfo[i]['mintDate'] = mintDate
      itemInfo[i]['releaseDate'] = releaseDate
    }
    var collectionInfo = itemInfo[0]
    console.log(collectionInfo)
    let username = req.cookies.username;
    console.log(username)
    if (username != null) {
      res.render('collection', {
        username:username, 
        loggedIn:true,
        dataExists:true,
        collectionInfo:collectionInfo,
        itemInfo:itemInfo
      })
    } else {
      res.render('collection', {
        username:username, 
        loggedIn:false,
        dataExists:true,
        collectionInfo:collectionInfo,
        itemInfo:itemInfo
      })
    }
  })
  // close db
  db.close((error) => {
    if (error) return console.log(error.message);
  })
})
app.get("/collections/:collectionId/rankings", function (req, res) {
    req.params; 
    let collectionId = req.params["collectionId"]

    // send stylelized html file w/ the collection and its current rankings by hours listened
})
//trade page, to allow users to see
app.get('/trades', function (req,res) {
  checkTrades()
  let username = req.cookies.username;
  console.log(username)
  if (username != null) {
    //GRAB INBOX INFO
    //open db
    const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
      if (error) return console.log(error.message);
      console.log("database connected")
    });
    let query1 = `
      SELECT tradeID, receiveUserID, receiveUsers.username AS receiveUserUsername, receiveUsers.profilePhoto AS receiveUserProfilePhoto, 
      receiveItemID, receiveItems.name AS receiveItemName, receiveItems.mediaType AS receiveItemMediaType, receiveItems.mediaLink AS receiveItemMediaLink, receiveItems.mintDate AS receiveItemMintDate, 
      receiveCollections.name AS receiveCollectionName, receiveCollections.collectionID AS receiveCollectionID,
      sendUserID, sendUserUsername, sendUserProfilePhoto, 
      sendItemID, sendItemName, sendItemMediaType, sendItemMediaLink, sendItemMintDate, 
      sendCollectionName, sendCollectionID 
      FROM (
        SELECT trades.tradeID, trades.receiveUserID, trades.receiveItemID, trades.sendUserID, sendUsers.username AS sendUserUsername, sendUsers.profilePhoto AS sendUserProfilePhoto, 
        trades.sendItemID, sendItems.name AS sendItemName, sendItems.mediaType AS sendItemMediaType, sendItems.mediaLink AS sendItemMediaLink, sendItems.mintDate AS sendItemMintDate, 
        sendCollections.name AS sendCollectionName, sendCollections.collectionID AS sendCollectionID 
        FROM (
          SELECT trades.tradeID, trades.receiveUserID, trades.receiveItemID, trades.sendUserID, trades.sendItemID
          FROM trades
          INNER JOIN users ON trades.receiveUserID = users.userID
          WHERE users.username="${username}" AND trades.completion=${false}
        ) AS trades
        INNER JOIN users AS sendUsers ON sendUsers.userID = trades.sendUserID
        INNER JOIN items AS sendItems ON sendItems.ownerID = sendUsers.userID
        INNER JOIN collections AS sendCollections ON sendCollections.collectionID = sendItems.collectionID
        WHERE sendItems.itemID = trades.sendItemID
      ) AS trades
      INNER JOIN users AS receiveUsers ON receiveUsers.userID = trades.receiveUserID
      INNER JOIN items AS receiveItems ON receiveItems.ownerID = receiveUsers.userID
      INNER JOIN collections AS receiveCollections ON receiveCollections.collectionID = receiveItems.collectionID
      WHERE receiveItems.itemID = trades.receiveItemID`
    db.all(query1, function (error, trades){
      // if (error) {return res.redirect('/trades')};
      if (error) {return console.log(error.message)};
      for (let i = 0; i < trades.length; i++) {
        let item1Time = new Date(trades[i]['receiveItemMintDate'])
        let date1 = item1Time.toDateString()
        let item2Time = new Date(trades[i]['sendItemMintDate'])
        let date2 = item2Time.toDateString()
        trades[i]['receiveItemMintDate'] = date1
        trades[i]['sendItemMintDate'] = date2
      }
      console.log(trades)
      res.render('tradesNEW', {
        username:username, 
        loggedIn:true,
        tradesExists:trades.length > 0,
        tradeData:trades
      })
    })
    //close db
    db.close((error) => {
      if (error) return console.log(error.message);
    })
  } else {
    res.redirect('/login')
  }
})
app.post('/trades/send', function (req,res) {
  var sendUserUsername = req.cookies.username
  var sendItemID = req.body['sendItemID']
  var receiveUserUsername = req.body['receiveUserUsername']
  var receiveItemID = req.body['receiveItemID']
  //open db
  const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
    if (error) return console.log(error.message);
    console.log("database connected")
  });
  //verify login of sender
  //verify ownership of sender + items
  //verify existence & ownership of receiver + items
  var query1 = `
      SELECT userID FROM users
      INNER JOIN items ON items.ownerID = users.userID
      WHERE username="${sendUserUsername}" AND itemID="${sendItemID}"`
  var query2 = `
      SELECT userID FROM users
      INNER JOIN items ON items.ownerID = users.userID
      WHERE username="${receiveUserUsername}" AND itemID="${receiveItemID}"`
  db.all(query1, function (error, row1) {
    if (error) {return res.redirect('trades')}
    console.log(row1)
    var sendUserID = row1[0]['userID']
    db.all(query2, function(error, row2) {
      if (error) {return res.redirect('trades')}
        console.log(row2)
        console.log('here2')
        var receiveUserID = row2[0]['userID']
        //create trade in db
        var tradeID = makeID(16)
        var sendUserApproval = true
        var receiveUserApproval = false
        var completion = false
        var date = null
        createTrade(tradeID, sendItemID, receiveItemID, sendUserID, receiveUserID, sendUserApproval, receiveUserApproval, completion, date)
        let username = req.cookies.username;
        res.redirect('/trades')
    })
  })
  //close db
  db.close((error) => {
    if (error) return console.log(error.message);
  })
})
app.post('/trades/inbox', function (req,res) {
  let username = req.cookies.username;
  console.log(username)
  if (username != null) {
    
  } else {
    res.render('index', {
      username:username, 
      loggedIn:false
    })
  }
  
})
app.post("/trades/confirm", function (req,res) {
  var receiveUserUsername = req.body['receiveUserUsername']
  var receiveItemID = req.body['receiveItemID']
  var sendUserUsername = req.body['sendUserUsername']
  var sendItemID = req.body['sendItemID']
  //open db
  const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
    if (error) return console.log(error.message);
    console.log("database connected")
  });
  //authentication of ownerships
  var query1 = `
      SELECT userID FROM users
      INNER JOIN items ON items.ownerID = users.userID
      WHERE username="${sendUserUsername}" AND itemID="${sendItemID}"`
  var query2 = `
      SELECT userID FROM users
      INNER JOIN items ON items.ownerID = users.userID
      WHERE username="${receiveUserUsername}" AND itemID="${receiveItemID}"`
  db.all(query1, function (error, row1) {
    if (error) return console.log(error.message)
    if (error) return console.log(error)
    console.log(row1)
    var sendUserID = row1[0]['userID']
    db.all(query2, function(error, row2) {
      if (error) return console.log(error.message)
      var receiveUserID = row2[0]['userID']
      db.run(`UPDATE trades SET receiveUserApproval=${true} WHERE sendUserID="${sendUserID}" AND sendItemID="${sendItemID}" AND receiveUserID="${receiveUserID}" AND receiveItemID="${receiveItemID}"`)
      checkTrades()
      res.redirect('/trades')
    })
  })
  //close db
  db.close((error) => {
    if (error) return console.log(error.message);
  })
})
app.get("/profile/:username", function (req, res) {
  let username = req.cookies.username;
  let searchUsername = req.body['username']
  console.log(username)
  if (username != null) {
    res.render('profile', {
      username:username, 
      loggedIn:true,
      searchUsername:searchUsername
    })
  } else {
    res.render('profile', {
      username:username, 
      loggedIn:false,
      searchUsername:searchUsername
    })
  }
})
app.get("/inventory", function (req, res) {
  let username = req.cookies.username;
  if (username != null) {
    res.redirect(`inventory/${username}`)
  }
  res.render('inventory', {
    username:username, 
    loggedIn:true,
    searchUsername:null,
    profilePhoto:null,
    items:null,
    itemsExist:false,
    dataExists:false, 
    dataNotExists:true
  })
})
app.post("/inventory", function (req, res) {
  req.body;
  res.redirect(`/inventory/${req.body['username']}`)
})
app.get("/inventory/:username", function (req, res) {
  let username = req.cookies.username;
  req.params;
  var searchUsername = req.params["username"]
  //open db
  const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
    if (error) return console.log(error.message);
    console.log("database connected")
  });
  let query = 
    `SELECT users.profilePhoto, items.name, items.itemID, items.mediaType, items.mediaLink, items.mintDate, collections.name AS collectionName FROM users 
    INNER JOIN items ON users.userID = items.ownerID 
    INNER JOIN collections ON collections.collectionID = items.collectionID 
    WHERE username="${searchUsername}"
    ORDER BY items.mintDate DESC`
  db.all(query, function (error, rows) {
    if (error) return res.render('inventory', {username:null, loggedIn:false, searchUsername:null,  profilePhoto:null, items:null, itemsExist:false, dataExists:false, dataNotExists:true});
    if (rows.length == 0) {
      return res.render('inventory', {username:null, loggedIn:false, searchUsername:null, profilePhoto:null, items:null, itemsExist:false, dataExists:false, dataNotExists:true});
    } else {
      var itemsExist = true
      var dataNotExists = false
      for (let i = 0; i < rows.length; i++) {
        let exactTime = new Date(rows[i]['mintDate'])
        let date = exactTime.toDateString()
        rows[i]['mintDate'] = date
      }
      var profilePhoto = rows[0]["profilePhoto"]
    }
    console.log(rows)
    let username = req.cookies.username;
    console.log(username)
    if (username != null) {
      var loggedIn = true
    } else {
      var loggedIn = false
    }
    res.render('inventory', {
      username:username, 
      loggedIn:loggedIn,
      searchUsername:searchUsername,
      profilePhoto:profilePhoto,
      items:rows,
      itemsExist:itemsExist,
      dataExists:true, 
      dataNotExists:dataNotExists
    })
  })
  //close db
  db.close((error) => {
    if (error) return console.log(error.message);
  })
})

//---------------Startup--------------//
app.listen(port);
console.log('server is listening');

//CxHnYeccNCWorMB9 --> qS581k1u4ODU2u3o
//