//Unit Test setup
var assert = require('assert');
var sinon = require('sinon');
var PassThrough = require('stream').PassThrough;
var http = require('http');


var api = require('food.js');

describe('api', function() {
	beforeEach(function() {
		this.request = sinon.stub(http, 'request');
	});
 
	afterEach(function() {
		http.request.restore();
	});
 
  //Test GET request
	it('should convert get result to object', function(done) {
  	var expected = { hello: 'world' };
  	var response = new PassThrough();
  	response.write(JSON.stringify(expected));
  	response.end();
   
  	var request = new PassThrough();
   
  	this.request.callsArgWith(1, response)
  	            .returns(request);
   
  	api.get(function(err, result) {
  		assert.deepEqual(result, expected);
  		done();
  	});
  });
  
  //Test POST request
  it('should send post params in request body', function() {
  	var params = '/food';
  	var expected = JSON.stringify(params);
   
  	var request = new PassThrough();
  	var write = sinon.spy(request, 'write');
   
  	this.request.returns(request);
   
  	api.post(params, function() { });
   
  	assert(write.withArgs(expected).calledOnce);
  });


  //Test error scenario
  it('should pass request error to callback', function(done) {
  	var expected = 'some error';
  	var request = new PassThrough();
   
  	this.request.returns(request);
   
  	api.get(function(err) {
  		assert.equal(err, expected);
  		done();
  	});
   
	  request.emit('error', expected);
  });

 
  
});

res.status(200).json(result.rows);
