var express = require('express');
var request = require('request');
var router = express.Router();
var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);
var pluralise = require('pluralize');
var _ = require('underscore')._;

/* GET users listing. */
router.get('/', function(req, res) {
  var ontologies = {};

  req.db.scan('ontologies', function(ontology) {
    ontologies[ontology.id] = ontology; 
  }, function() {
    res.render('ontologies', {
      'title': 'Ontology List',
      'ontologies': ontologies
    });
  });
});

router.get('/upload', function(req,res) {
  res.render('upload_new', {
      'noun': pluralise(names.choose()),
  });
});

router.post('/:id/update', function(req, res) { // this is just to update the deets
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    if(req.user && (req.user.admin || (req.user.owns && _.include(req.user.owns, ontology.id)))) {
      ontology.name = req.body.name;
      ontology.description = req.body.description;
      req.db.save('ontologies', ontology.id, ontology, function() {
        req.flash('info', 'Ontology Updated');
        res.redirect('/ontology/'+ontology.id+'/manage');
      });
    } else {
      req.flash('error', 'Please log in to manage this ontology');
      res.redirect('/login');
    }
  });
});

router.post('/:id/updatesyncmethod', function(req, res) { // this is just to update the deets
console.log(_.keys(req.body));
  /*req.db.read('ontologies', req.params.id, function(err, ontology) {
    if(req.user && (req.user.admin || (req.user.owns && _.include(req.user.owns, ontology.id)))) {
      ontology.name = req.body.name;
      ontology.description = req.body.description;
      req.db.save('ontologies', ontology.id, ontology, function() {
        req.flash('info', 'Ontology Updated');
        res.redirect('/ontology/'+ontology.id+'/manage');
      });
    } else {
      req.flash('error', 'Please log in to manage this ontology');
      res.redirect('/login');
    }
  });*/
});

router.post('/upload', function(req, res) {
    req.db.read('ontologies', req.body.acronym, function(err, exOnt) { 
      if(!exOnt) { 
        fs.readFile(req.files.ontology.path, function (err, data) {
          var newName = req.body.acronym + '_1.ont',
              newPath = __dirname + '/public/onts/' + newName;

          fs.writeFile(newPath, data, function (err) {
            // Create ontology in DB
            var time = Date.now();
            var ont = {
              'id': req.body.acronym,
              'name': req.body.name,
              'lastSubDate': time,
              'submissions': {
                
              },
              'status': 'untested'
            };
            ont.submissions[time] = newName;

            req.db.save('ontologies', req.body.acronym, ont, function(err) {
              request.get(req.aberowl + 'reloadOntology.groovy', {
                'qs': {
                  'name': req.body.acronym 
                } // Later this will need API key
              }, function() {}); // we don't actually care about the response

              req.flash('Ontology uploaded successfully. Depending on the size of your ontology, you may want to grab a cup of tea while it\'s reasoning')
              res.redirect('/' + req.body.name);
            });
          });
        });
      } else {
        req.flash('Ontology with acronym ' + req.body.acronym + ' already exists!');
        res.redirect('/upload')
      }
    });
});

router.get('/:id', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    request.get(req.aberowl + 'getStats.groovy', {
      'qs': {
        'ontology': ontology.id
      },
      'json': true
    }, function(request, response, body) {
      res.render('ontology', {
        'ontology': ontology,
        'stats': body
      });
    });
  });
});

router.get('/:id/downloads', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    res.render('ontology_download', {
      'ontology': ontology
    });
  });
});

router.get('/:id/manage', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    if(req.user && (req.user.admin || (req.user.owns && _.include(req.user.owns, ontology.id)))) {
      res.render('ontology_manage', {
        'ontology': ontology
      });
    } else {
      req.flash('error', 'Please log in to manage this ontology');
      res.redirect('/login');
    }
  });
});

router.get('/:id/query', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    res.render('ontology_query', {
      'ontology': ontology
    });
  });
});

// Reloaded event
// Note sure this is the best way to do this but eh
router.get('/:id/reloaded', function(req, res) {
  var success = req.params.result;

  // Send an email or whatever

  // If no success then BALEET
});

module.exports = router;
