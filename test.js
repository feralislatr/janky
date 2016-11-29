'use strict';

var test = require('tape');
var request = require('supertest');
var app = require('./food');
///
var sinon = require('sinon');
var mock = sinon.mock(app);

var queryString = 'SELECT * FROM food'
var queryParams = ""
mock.expects('get').withArgs(queryString, queryParams).yields(null, "");


//var request = require('request');
// request(mock, function (error, response, body) {
//   if (!error && response.statusCode == 200) {
//     console.log("hi this work") // Print the web page.
//   }
// })

//first attempt get test
// test('Get food', function (assert) {
//   request(mock) //app
//     .get('/food')
//     //.expect('Content-Type', /json/)
//     .expect(200)
//     .end(function (err, res) {
//       var expectedResponse = 200;

//       assert.error(err, 'No error');
//       assert.same(res.body, expectedResponse, 'Everything works');
//       assert.end();
     
//     });
// });


//second attempt get test
// test('GET /food', function (assert) {
// 	console.log(app.address); //undefined; app.address() is not a function
//   request(mock.app) //app.address undefined when using mock.app; not a function with just mock
//     .get('/food')
//     .expect(200)
//     .expect('Content-Type', /json/)
//     .end(function (err, res) {
//       var expectedThings = [
//       {food: "", name: "", author: "", rating: ""}
//       ];
//       var actualThings = res.body;
 
//       assert.error(err, 'No error');
//       assert.same(actualThings, expectedThings, 'Retrieve list of food');
//       assert.end();
//     });
// });

//actually gets 404 and returns "There has been an error connecting to the database"

//mock.verify()
//mock.restore()
