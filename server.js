const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
const app = express();
const pgp = require("pg-promise")();
/* Middleware */
app.use(bodyParser.json());
app.use(cors());

/* Database */
const database = pgp({
  host: "localhost",
  port: 5432,
  database: "my-face-recognition",
  user: "postgres",
  password: "2163",
  max: 30, // use up to 30 connections
});

app.post("/signin", (req, res) => {
  const { email, password } = req.body;
  database
    .any("SELECT * FROM login WHERE email = ${SQLemail}", {
      SQLemail: email,
    })
    .then((user) => {
      bcrypt.compare(password, user[0].hash, function (err, result) {
        console.log(result);
        if (result) {
          database
            .any("SELECT * FROM users WHERE email = ${SQLemail}", {
              SQLemail: email,
            })
            .then((user) => {
              res.json(user[0]);
            });
        } else {
          res.status("400").send("Wrong credential");
        }
      });
    })
    .catch(console.log);
});
app.put("/img/:id", (req, res) => {
  const { id } = req.params;
  database
    .none("UPDATE users SET entries = entries + 1 WHERE id = ${id}; ", {
      id,
    })
    .catch(console.log)
    .finally(res.send("Success"));
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  var hash = "";

  database
    .none(
      "INSERT INTO users (name,email,joined) VALUES (${SQLname},${SQLemail},${joined})",
      {
        SQLname: name,
        SQLemail: email,
        joined: new Date(),
      }
    )
    .then(
      bcrypt.hash(password, 10, (err, hashpassword) => {
        database
          .none("INSERT INTO login (hash,email) VALUES (${hash},${SQLemail})", {
            hash: hashpassword,
            SQLemail: email,
          })
          .then(
            database
              .any("SELECT * FROM users WHERE email = ${SQLemail}", {
                SQLemail: email,
              })
              .then((user) => {
                res.json(user[0]);
              })
          );
      })
    )
    .catch((err) => {
      console.log(err);
      res.status("400").send("Unable to register");
    });
});
app.get("/", (req, res) => {
  res.send(database);
});

// Post --> /register
app.listen(3000);
