'use strict';

var pgtest = require('pgtest');
var asserts = require('assert');
var equals = require('array-equal')


pgtest.expect('SELECT * FROM food').returning(null, [
    [ 'beans', 'raplh', '10', 'protein' ],
	[ 'greens', 'jake', '9', 'veg' ]
]);

var testdata = {rows:[
	[ 'beans', 'raplh', '10', 'protein' ],
    [ 'greens', 'jake', '9', 'veg' ] 
   ]};

pgtest.connect('food', function (err, client, done){
	client.query('SELECT * FROM food', function (err, data){
		asserts(equals(data, testdata));
		    if (err){
		    	done(err);
		    } else{
		    	console.log("hi i worked; here are data");
		    	console.log(data);
		       	done();
		   	}
		        
	 });
});


pgtest.check();
