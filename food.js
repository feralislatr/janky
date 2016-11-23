
'use strict';

const express = require('express');
const pg = require('pg');
const PORT = 8080;
const app = express();
const sys = require('sys')
const exec = require('child_process').exec;

var get = app.get();
var post = app.post();
module.exports= {
  get: function('/food', function (req, res){
    //app.get('/food', function (req, res) {
    
    console.log("In the food");
    var client = new pg.Client();
    client.connect(function (err) {
      if (err) {
        console.log(err);
        res.status(404).json({message: "There has been an error connecting to the database."});
      }
      else {
        client.query('SELECT * FROM food', function(err, result) {
          if (err) {
            console.log(err);
            res.status(500).json({message: err});
          }
          else {
            console.log(result.rows);
            res.status(200).json(result.rows);
          }
        });
      }
    });
  //});

  }); //app.get

  post: function('/food', function (req, res){
    //app.post('/food', function (req, res) {
    console.log('Creaing a new food');
    var client = new pg.Client();
    client.connect(function (err) {
      if (err) {
        console.log(err);
        res.status(404).json({message: "There has been an error connecting to databse."});
      }
      else {
        client.query('INSERT INTO food (name, author, rating, category) VALUES ($1, $2, $3,$4)', [req.param('name'), req.param('author'), req.param('rating'), req.param('category')], function(err, result) {
          if (err) {
            console.log(err);
            res.status(500).json({message: "There was problem adding a new record to the database."});
          }
          else {
            console.log(result);
            res.status(201).json(result);
          }
        });
      }
      })
    //});

  }); //app.post

}//module.exports



var child = exec("./node_modules/.bin/pg-migrate up", function (error, stdout, stderr) {
  sys.print('stdout: ' + stdout);
  sys.print('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }
});

app.listen(PORT);
console.log('Running a server on port: ' + PORT);
