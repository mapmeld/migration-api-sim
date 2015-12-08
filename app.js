var express = require('express');
var bodyParser = require("body-parser");
var compression = require("compression");

var mongoose = require('mongoose');

mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGODB_URI || 'localhost');

var Post = require('./models/post');
var Question = require('./models/question');

var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express['static'](__dirname + '/static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression());

app.get('/', function (req, res) {
  Question.find({}, function (err, questions) {
    if (err) {
      return res.json(err);
    }
    res.render('index', {
      questions: questions
    });
  });
});

app.post('/questions', function (req, res) {
  var q = new Question();
  q.question = req.body.question;
  q.language = req.body.language;
  if (req.body.tags) {
    q.tags = req.body.tags.split(/[\s+]?,[\s+]?/);
  } else {
    q.tags = [];
  }
  if (req.body.stage) {
    q.stage = req.body.stage;
  }
  q.created_at = new Date();
  q.updated_at = new Date();

  q.save(function (err) {
    if (err) {
      return res.json(err);
    }
    res.redirect('/questions/' + q._id);
  });
});

app.post('/posts', function (req, res) {
  var p = new Post();
  p.title = req.body.title;
  p.description = req.body.description;
  p.source = req.body.source;
  if (req.body.tags) {
    p.tags = req.body.tags.split(/[\s+]?,[\s+]?/);
  } else {
    p.tags = [];
  }
  p.language = req.body.language;
  p.type = req.body.type;
  p.data = {
    content: req.body.content,
    media_url: req.body.media_url
  };
  if (req.body.question_id) {
    p.question_ids = [ req.body.question_id ];
  } else {
    p.question_ids = [];
  }
  if (req.body.stage) {
    p.stages = [req.body.stage];
  } else {
    p.stages = [];
  }
  p.created_at = new Date();
  p.updated_at = new Date();
  p.save(function (err) {
    if (err) {
      return res.json(err);
    }
    res.redirect('/posts/' + p._id);
  });
});

function adjustResponse(post_or_question) {
  if (!post_or_question) {
    return null;
  }
  var returned = {
    id: post_or_question._id
  };
  for (var key in post_or_question) {
    if (['question', 'stage', 'updated_at', 'created_at', 'type', 'language', 'source', 'description', 'title', 'question_ids', 'data', 'tags'].indexOf(key) > -1) {
      returned[key] = post_or_question[key];
    }
  }
  return returned;
}

function shareQandA(questions, posts, req, res) {
  var per_page = req.query.per_page || 20;
  Question.count({}, function (err, qall) {
    if (err) {
      return res.json(err);
    }
    Post.count({}, function (err, pall) {
      if (err) {
        return res.json(err);
      }

      var total_pages = Math.ceil(Math.max(qall, pall) / per_page);
      if (!questions.length) {
        total_pages = Math.ceil(pall / per_page);
      } else if (!posts.length) {
        total_pages = Math.ceil(qall / per_page);
      }

      res.json({
        meta: {
          pagination: {
            questions_total: qall,
            questions_count: questions.length,
            posts_total: pall,
            posts_count: posts.length,
            per_page: per_page,
            current_page: (req.query.page || 1) * 1,
            total_pages: total_pages
          }
        },
        questions: questions.map(adjustResponse) || [],
        posts: posts.map(adjustResponse) || []
      });
    });
  });
}

function addQueries(type, req) {
  var page = (req.query.page || 1) * 1;
  var per_page = req.query.per_page || 20;

  var query = type.find({})
    .limit(per_page)
    .skip(per_page * (page - 1))
    .sort('-updated_at');

  if (req.query.type) {
    query = query.where('type').equals(req.query.type);
  }
  if (req.query.language) {
    query = query.where('language').equals(req.query.language);
  }
  if (req.query.tags) {
    query = query.where('tags').equals(req.query.tags);
  }
  if (req.query.stage) {
    query = query.where('stage').equals(req.query.stage);
  }
  if (req.query.updated_since) {
    var lastUpdate = new Date(req.query.updated_since);
    query = query.where('updated_at').gt(lastUpdate);
  }
  return query;
}

app.get('/latest', function (req, res) {
  var pq = addQueries(Post, req);
  var qq = addQueries(Question, req);
  pq.exec(function (err, posts) {
    if (err) {
      return res.json(err);
    }
    qq.exec(function (err, questions) {
      if (err) {
        return res.json(err);
      }
      shareQandA(questions, posts, req, res);
    });
  });
});

app.get('/latest/posts', function (req, res) {
  var query = addQueries(Post, req);

  query.exec(function (err, posts) {
    if (err) {
      return res.json(err);
    }
    shareQandA([], posts, req, res);
  });
});

app.get('/latest/questions', function (req, res) {
  var query = addQueries(Question, req);

  query.exec(function (err, questions) {
    if (err) {
      return res.json(err);
    }
    shareQandA(questions, [], req, res);
  });
});

app.get('/posts/:id', function (req, res) {
  Post.findById(req.params.id, function (err, post) {
    res.json(err || adjustResponse(post));
  });
});

app.get('/questions/:id', function (req, res) {
  Question.findById(req.params.id, function (err, question) {
    res.json(err || adjustResponse(question));
  });
});

var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log('Serving on port ' + port);
});

module.exports = app;
