var express = require('express');
var router = express.Router();

router.get('/:id',function(req, res, next){
	res.send(req.params.id + " " + Date.now());
	next();
});

router.post('/', function(req, res){
	res.send("Post method!");
});



module.exports = router;