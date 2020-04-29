var express = require('express');
// модуль для парсинга пути
var path = require('path');
var log = require('./libs/log.js')(module);
var app = express();
var config = require('./libs/config');
var ArticleModel = require('./libs/mongoose.js').ArticleModel;
console.log(ArticleModel)
// віддаємо фавіконку, також можемо свою віддати(можливо потрібен тіліки шлях)
app.use(express.favicon());
// виводимо всі запроси в консоль
app.use(express.logger('dev'));
// стандартний модуль для парсингу JSON в запросах
app.use(express.bodyParser());
// добавляем put & delete
app.use(express.methodOverride());
// модуль для простого задания обработчиков путей
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.listen(config.get('port'), function() {
	log.info('Express server listening on port '+config.get('port'));
});
// -------------------------- Обработка ошыбок
app.use(function(req, res, next) {
	res.status(404);
	log.debug('Not found URL: %s', req.url);
	res.send({error: 'Not found'});
	return;
});
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	log.error('Internal error (%d): %s', res.statusCode, err.message);
	res.send({error: err.message});
	return;
});
app.get('/ErrorExample', function(req, res, next) {
	next(new Error('Random error!'));
});
// -------------------------- Обработка ошыбок
//---------------------------------------------- api functions: GET, POST, PUT, DELETE
app.get('/api/articles', function(req, res) {
	return ArticleModel.find(function(err, articles) {
		if (!err) {
			return res.send(articles);
		} else {
			res.statusCode = 500;
			log.error('Internal error(%d): %s', res.statusCode, err.message);
			return res.send({error: 'Server error'});
		}
	});
});
app.post('/api/articles', function(req, res) {
	var article = new ArticleModel({
		title: req.body.title,
		author: req.body.author,
		description: req.body.description,
		images: req.body.images
	});
	article.save(function(err) {
		if (!err) {
			log.info('article created');
			return res.send({
				status: 'OK',
				article: article
			});
		} else {
			console.log(err);
			if (err.name == 'ValidationError') {
				res.statusCode = 400;
				res.send({error: 'Validation error'});
			} else {
				res.statusCode = 500;
				res.send({error: 'Server error'});
			}
			log.error('Internal error(%d): %s', res.statusCode, err.message);
		}
	});
});
app.get('/api/articles/:id', function(req, res) {
	return ArticleModel.findById(req.params.id, function(err, article) {
		if (!article) {
			res.statusCode = 404;
			return res.send({error: 'Not found'});
		}
		if (!err) {
			return res.send({
				status: 'OK',
				article: article
			});
		} else {
			res.statusCode = 500;
			log.error('Internal error(%d): %s', res.statusCode, err.message);
			return res.send({error: 'Server error'});
		}
	});
});
app.put('/api/articles/:id', function(req, res) {
	return ArticleModel.findById(req.params.id, function(err, article) {
		if (!article) {
			res.statusCode = 404;
			return res.send({error: 'Not found'});
		}
		article.title = req.body.title;
		article.description = req.body.description;
		article.author = req.body.author;
		article.images = req.body.images;
		return article.save(function(err) {
			if (!err) {
				log.info('article updated');
				return res.send({status: 'OK', article: article});
			} else {
				if (err.name == 'ValidationError') {
					res.statusCode = 400;
					res.send({error: 'Validation error'});
				} else {
					res.statusCode = 500;
					res.send({error: 'Server error'});
				}
				log.error('Internal error(%d): %s', res.statusCode, err.message);
			}
		});
	});
});
app.delete('/api/articles/:id', function(req, res) {
	return ArticleModel.findById(req.params.id, function (err, article) {
		if (!article) {
			res.statusCode = 400;
			return res.send({error: 'Not found'});
		}
		return article.remove(function(err) {
			if (!err) {
				log.info('article removed');
				return res.send({status: 'OK'});
			} else {
				res.statusCode = 500;
				log.error('Internal error(%d): %s', res.statusCode, err.message);
				return res.send({error: 'Server error'});
			}
		});
	});
});
//---------------------------------------------- api functions: GET, POST, PUT, DELETE
