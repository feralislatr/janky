'use strict';

var test = require('tape');
var request = require('supertest');
//var app = require('./food');
///
var sinon = require('sinon');
var mock;

mock = sinon.mock(require('./food'));
//var queryString = 'SELECT * FROM food'
//var queryParams = ""
//mock.expects('query').with(queryString, queryParams).yields(null, rows);


//var request = require('request');
request(mock, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log("hi this work") // Print the web page.
  }
})

// test('Correct result returned', function (t) {
//   request(mock) //app
//     .get('/food')
//     //.expect('Content-Type', /json/)
//     .expect(200)
//     .end(function (err, res) {
//       var expectedResponse = 200;

//       t.error(err, 'No error');
//       t.same(res.body, expectedResponse, 'Everything works');
//       t.end();
     
//     });
// });

mock.verify()
mock.restore()
