import express, { response } from 'express';
import wikiService from './wiki-service';

/**
 * Express router containing wiki methods.
 */
const router = express.Router();

router.get('/articles', (_request, response) => {
  wikiService
    .getArticles()
    .then((rows) => response.send(rows))
    .catch((error) => response.status(500).send(error));
});
router.get('/articles/:article_id', (request, response) => {
  const article_id = Number(request.params.article_id);
  wikiService
    .getArticle(article_id)
    .then((article) => response.send(article))
    .catch((error) => response.status(500).send(error));
});
router.get('/articles/:article_id/version/:version_number', (request, response) => {
  const article_id = Number(request.params.article_id);
  const version_number = Number(request.params.version_number);
  wikiService
    .getVersion(article_id, version_number)
    .then((article) => response.send(article))
    .catch((error) => response.status(500).send(error));
});
router.get('/articles/:article_id/versionhistory', (request, response) => {
  const article_id = Number(request.params.article_id);
  wikiService
    .versionHistory(article_id)
    .then((rows) => response.send(rows))
    .catch((error) => response.status(500).send(error));
});

router.post('/articles/:article_id/viewed', (request, response) => {
  const article_id = Number(request.params.article_id);
  wikiService
    .viewArticle(article_id)
    .then(() => response.send())
    .catch((error) => response.status(500).send(error));
});

router.post('/articles', (request, response) => {
  const data = request.body;
  if (data.article && data.article.title && data.article.content && data.article.author)
    if (data.article.article_id && data.article.article_id != 0) {
      wikiService
        .editArticle(data.article)
        .then((id) => response.send({ id: id }))
        .catch((error) => response.status(500).send(error));
    } else {
      wikiService
        .createArticle(data.article)
        .then((id) => response.send({ id: id }))
        .catch((error) => response.status(500).send(error));
    }
  else response.status(400).send('Missing data');
});

router.post('/articles/:article_id/comments/new', (request, response) => {
  const data = request.body;
  if (data.comment && data.comment.content && data.comment.user && data.comment.article_id)
    if (data.comment.article_id != 0) {
      
      wikiService
        .addComment(data.comment)
        .then((id) => {
          response.send({ id: id });
        })
        .catch((error) => response.status(500).send(error));
    }
});

router.get('/articles/:article_id/comments', (request, response) => {
  const article_id = Number(request.params.article_id);
  wikiService
    .getComments(article_id)
    .then((rows) => {
      response.send(rows);
    })
    .catch((error) => response.status(500).send(error));
});

router.delete('/articles/:article_id/comments/:comment_id', (request, response) => {
  const comment_id = Number(request.params.comment_id);
  wikiService.deleteComment(comment_id).then((message)=> response.send(message));
});

router.post('/articles/:article_id/comments/:comment_id', (request, response) => {
  const data = request.body;
  if (data.comment.content)
     wikiService.editComment(data.comment)
  console.log('from router');
  console.log(data.comment)
  
  
  
});

export default router;
