'use strict';

var test = require('tape');
var request = require('supertest');
var app = require('./food');
///
var sinon = require('sinon');
var mock;

mock = sinon.mock(app);
//var queryString = 'SELECT * FROM food'
//var queryParams = ""
//mock.expects('query').with(queryString, queryParams).yields(null, rows);


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
test('GET /food', function (assert) {
  request(app)
    .get('/food')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function (err, res) {
      var expectedThings = [
      ];
      var actualThings = res.body;
 
      assert.error(err, 'No error');
      assert.same(actualThings, expectedThings, 'Retrieve list of food');
      assert.end();
    });
});

mock.verify()
mock.restore()
