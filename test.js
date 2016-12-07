'use strict';

var pgtest = require('pgtest');
var asserts = require('assert');
var equals = require('array-equal')


var queries = [
	'SELECT * FROM food','INSERT INTO food VALUES "potatoes", "tonka", "8", "starch"', 'DELETE FROM food WHERE name="beans"'
]

//SELECT
pgtest.expect(queries[0]).returning(null, [
    [ 'beans', 'raplh', '10', 'protein' ],
	[ 'greens', 'jake', '9', 'veg' ]
]);

//expected result
var testdata = {rows:[
	[ 'beans', 'raplh', '10', 'protein' ],
    [ 'greens', 'jake', '9', 'veg' ] 
   ]};

pgtest.connect('food', function (err, client, done){
	client.query(queries[0], function (err, data){
		asserts(equals(data, testdata));
		    if (err){
		    	done(err);
		    } else{
		    	console.log("Select test passed", data);
		       	done();
		   	}
		        
	 });
});

pgtest.check();

pgtest.reset();

//INSERT
pgtest.expect(queries[1] ).returning(null, [
    [ 'beans', 'raplh', '10', 'protein' ],
	[ 'greens', 'jake', '9', 'veg' ],
	[ "potatoes", "tonka", "8", "starch" ]
]);

//expected result
testdata = {rows:[
	[ 'beans', 'raplh', '10', 'protein' ],
    [ 'greens', 'jake', '9', 'veg' ],
    [ "potatoes", "tonka", "8", "starch" ]
   ]};

pgtest.connect('food', function (err, client, done){
	client.query(queries[1], function (err, data){
		asserts(equals(data, testdata));
		    if (err){
		    	done(err);
		    } else{
		    	console.log("Insert test passed", data);
		       	done();
		   	}
		        
	 });
});

pgtest.check();

pgtest.reset();

//DELETE
pgtest.expect(queries[2]).returning(null, [
	[ 'greens', 'jake', '9', 'veg' ]
]);

//expected result
testdata = {rows:[
    [ 'greens', 'jake', '9', 'veg' ] 
   ]};

pgtest.connect('food', function (err, client, done){
	client.query(queries[2], function (err, data){
		asserts(equals(data, testdata));
		    if (err){
		    	done(err);
		    } else{
		    	console.log("Delete test passed", data);
		       	done();
		   	}
		        
	 });
});

pgtest.check();

