'use strict';

var test = require('tape');
//var request = require('supertest');
var app = require('./food');
///
var pgtest = require('pgtest');
var sinon = require('sinon');
var db = sinon.mock(app);


//first attempt get test
// test('Get food', function (assert) {
//   request(db) //app
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
// var expect = pgtest.expect('SELECT * FROM food').returning(null, [
//     [ 'beans', 'raplh', '10', 'protein' ],
// 	[ 'greens', 'jake', '9', 'veg' ],
//     [ 'potatoes', 'tonka', '8', 'starch' ],
//     [ 'tomatoes', 'rocko' , '7','fruit' ]

// ]);

// var connect = pgtest.connect('food', function (err, client, done) {
//     client.query('SELECT * FROM food', function (err, data) {
//         console.log(data);
//         done();
//     });
// });

//second attempt get test
//mock with pgtest in here
test('GET /food', function (assert) {
	//console.log(app.address); //undefined; app.address() is not a function
  // request(expect) //app.address undefined when using db.app; not a function with just db
  //   .get('/food')
  //   .expect(200)
  //   .expect('Content-Type', /json/)
  //   .end(function (err, res) {
  //     var expectedThings = [
  //     {name: "beans", author: "ralph", rating: "10", category: "protein"},
  //     {name: "greens", author: "jake", rating: "9", category: "veg"},
  //     {name: "potatoes", author: "tonka", rating: "8", category: "starch"},
  //     {name: "tomatoes", author: "rocko", rating: "7", category: "fruit"}

  //     ];
  //     var actualThings = res.body;
 
  //     assert.error(err, 'No error');
  //     assert.same(actualThings, expectedThings, 'Retrieve list of food');
  //     assert.end();
  //   });
// });
	pgtest.expect('SELECT * FROM food').returning(null, [
	    [ 'beans', 'raplh', '10', 'protein' ],
		[ 'greens', 'jake', '9', 'veg' ],
	    [ 'potatoes', 'tonka', '8', 'starch' ],
	    [ 'tomatoes', 'rocko' , '7','fruit' ]

	]);

	pgtest.connect('food', function (err, client, done) {
	    client.query('SELECT * FROM food', function (err, data) {
	        console.log(data);
	        done();
	    });
	});



	assert.error(err, 'No error');
  //     assert.same(actualThings, expectedThings, 'Retrieve list of food');
      assert.end();
});

//actually gets 404 and returns "There has been an error connecting to the database"

pgtest.check();
