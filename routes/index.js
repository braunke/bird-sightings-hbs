var express = require('express');
var router = express.Router()

var Bird = require('../models/bird');
//removes null values, not in database

/* GET home page. */
router.get('/', function(req, res, next) {
  Bird.find(function(err, birds){
    if (err) {
      return next(err);
    }

    res.render('index', { birds: birds });
  })
});

/* POST to home page - handle form submit */
router.post('/', function(req, res, next){

  // Make a copy of non-blank fields from req.body

  var birdData = {};

  for (var field in req.body) {
    if (req.body[field]) {      // Empty strings are false
      birdData[field] = req.body[field];
    }
  }

  // If either of the nest attributes provided, add them to birdData
  if (birdData.nestLocation || birdData.nestMaterials) {
    birdData.nest = {
      location: birdData.nestLocation,
      materials: birdData.nestMaterials
    };
  }

  // Remove non-nested data so no extra data being saved to database
  delete(birdData.nestLocation); delete(birdData.nestMaterials);

  // Extract the date, set to Date.now() if not present
    //make new array element with date and remove dateSeen
  var date = birdData.dateSeen || Date.now();
  birdData.datesSeen = [ date ];  // A 1-element array
  delete(birdData.dateSeen);   // remove dateSeen, don't need

  console.log(birdData);

  var bird = Bird(birdData);  //Create new Bird from req.body

  bird.save(function(err, newbird){

    if (err) {

      if (err.name == 'ValidationError') {

        //Loop over error messages and add the message to messages array
        var messages = [];
        for (var err_name in err.errors) {
          messages.push(err.errors[err_name].message);
        }

        req.flash('error', messages);
        return res.redirect('/')
      }

      //For other errors we have not anticipated, send to generic error handler
      return next(err);
    }

    console.log(newbird);
    return res.redirect('/')
  })
});

router.post('/addDate', function(req, res, next){

  if (!req.body.dateSeen) {
    req.flash('error', 'Please provide a date for your sighting of ' + req.body.name);
    return res.redirect('/');
  }

  // Find the bird with the given ID, and add this new date to the datesSeen array
  Bird.findById( req.body._id, function(err, bird) {
//checks for errors
    if (err) {
      return next(err);
    }

    if (!bird) {
      res.statusCode = 404;
      return next(new Error('Not found, bird with _id ' + req.body._id));
    }

    console.log('date saved = ' + req.body.dateSeen);

    bird.datesSeen.push(req.body.dateSeen);  // Add new date to datesSeen array

    console.log(bird.datesSeen)

    // And sort datesSeen
    bird.datesSeen.sort(function(a, b) {
      if (a.getTime() < b.getTime()) { return 1;  }
      if (a.getTime() > b.getTime()) { return -1; }
      return 0;
    });


    bird.save(function(err){
      if (err) {
        if (err.name == 'ValidationError') {
          //Loop over error messages and add the message to messages array
          var messages = [];
          for (var err_name in err.errors) {
            messages.push(err.errors[err_name].message);
          }
          req.flash('error', messages);
          return res.redirect('/')
        }
        return next(err);   // For all other errors
      }

      return res.redirect('/');  //If saved successfully, redirect to main page
    })
  });
});
router.post('/deleteBird', function(req, res, next){

  var id = req.body._id;
    Bird.findByIdAndRemove(id, function(err){
    if (err){
    return next(err);
    }
    req.flash('info', 'Deleted');
    return res.redirect('/')
})
});
//saves changes to bird
router.post('/saveBird', function(req, res, next){
  var id = req.body._id;
  req.body.nest = {};
  req.body.nest.location = req.body['nest.location'];
  req.body.nest.materials = req.body['nest.materials'];
  delete req.body['nest.location'];
  delete req.body['nest.materials'];
  Bird.findByIdAndUpdate(id, req.body, function(err){
    if(err){
      return next(err);
    }
    res.redirect('/');
  });
})
//separate page for each bird
router.get('/details/:id', function(req, res, next) {
    Bird.findById( req.params.id, function(err, bird) {
        if (err) {
            return next(err);  // 500 error
        }
        if (!bird) {
            return next();  // Creates a 404 error
        }
        res.render('bird_details', { bird: bird } );
    });
});

module.exports = router;
