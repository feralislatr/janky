'use strict';

var test = require('tape');
var request = require('supertest');
//var app = require('./food');
///
var sinon = require('sinon');
var mock;

mock = sinon.mock(require('/food'));
//mock.expects('query').with(queryString, queryParams).yields(null, rows);
///



// test('Correct result returned', function (t) {
//   request(mock) //app
//     .get('./food')
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
