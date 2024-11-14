import * as React from 'react';
import { Component } from 'react-simplified';
import { Alert, Card, Row, Column, Button, Form } from './widgets';
import { NavLink } from 'react-router-dom';
import wikiService from './wiki-service';
import { createHashHistory } from 'history';
import {
  FacebookShareButton,
  FacebookIcon,
  WhatsappShareButton,
  WhatsappIcon,
  TwitterShareButton,
  TwitterIcon,
} from 'react-share';

const history = createHashHistory(); // Use history.push(...) to programmatically change path, for instance after successfully saving a student

type Article = {
  article_id: number;
  title: string;
  content: string;
  author: string;
  edit_time: number;
  version_number: number;
};
//version_type er enten "createt", eller "edited"
type Version = {
  author: string;
  edit_time: number;
  version_number: number;
  version_type: string;
};

//comment type:
type Comment = {
  comment_id: number;
  article_id: number;
  user: string;
  content: string;
};

export class ArticleDetails extends Component<{
  match: { params: { article_id: number; version_number?: number } };
}> {
  comments: Comment[] = [];

  article: Article = {
    article_id: 0,
    title: '',
    content: '',
    author: 'anon',
    edit_time: 0,
    version_number: 0,
  };

  comment: Comment = {
    comment_id: 0,
    article_id: 0,
    user: '',
    content: '',
  };

  render() {
    const shareUrl = 'localhost:3000/#/articles/this.props.match.params.article_id';
    return (
      <>
        <Card title={this.article.title}>
          {this.props.match.params.version_number ? (
            <Row>
              <Column>Viewing version {this.props.match.params.version_number}</Column>
            </Row>
          ) : (
            <></>
          )}
          <Row>
            <Card title="">{this.article.content}</Card>
          </Row>
        </Card>
        <Card title="Comments">
          <Row>
            <Column>comment:</Column>
            <Column>Added by:</Column>
            <Column>Edit:</Column>
            <Column>Delete:</Column>
          </Row>
          {this.comments.map((comment, i) => (
            <Row key={i}>
              <Column>{comment.content}</Column>
              <Column>{comment.user}</Column>
              <Column>
                <Button.Light
                  onClick={() => {
                    const newContent = String(prompt('Write your comment:'));
                    comment.content = newContent;
                    wikiService.editComment(comment);
                  }}
                >
                  Edit
                </Button.Light>
              </Column>
              <Column>
                <Button.Danger
                  onClick={() => {
                    wikiService.deleteComment(comment).then((message) => {
                      alert(message);
                      this.mounted();
                    });
                  }}
                >
                  X
                </Button.Danger>
              </Column>
            </Row>
          ))}
        </Card>
        <Button.Success
          onClick={() => history.push('/articles/' + this.props.match.params.article_id + '/edit')}
        >
          Edit Article
        </Button.Success>
        <h6>Share article: </h6>
        <FacebookShareButton url={shareUrl}>
          <FacebookIcon size={30} round={true} />
        </FacebookShareButton>

        <WhatsappShareButton url={shareUrl}>
          <WhatsappIcon size={30} round={true} />
        </WhatsappShareButton>

        <TwitterShareButton url={shareUrl}>
          <TwitterIcon size={30} round={true} />
        </TwitterShareButton>

        <div></div>
        <Card title="">
          <Row>
            <Column width={2}>
              <Form.Label>Comment</Form.Label>
            </Column>
            <Column>
              <Form.Textarea
                type="text"
                value={this.comment.content}
                onChange={(event) => {
                  this.comment.content = event.currentTarget.value;
                }}
                rows={2}
              ></Form.Textarea>
            </Column>
          </Row>
        </Card>
        <Button.Success
          onClick={() => {
            const user = String(prompt('Username:'));
            this.comment.user = user;
            this.comment.article_id = this.article.article_id;
            wikiService
              .addComment(this.comment)
              .then((comment_id: number) => {
                history.push(
                  '/articles/' + this.props.match.params.article_id + '/comments/' + comment_id,
                );
              })
              .catch((error) => Alert.danger('Error adding comment: ' + error.message));
          }}
        >
          Add comment
        </Button.Success>

        <VersionHistory article_id={this.props.match.params.article_id} />
      </>
    );
  }

  mounted() {
    if (this.props.match.params.version_number) {
      wikiService
        .getVersion(this.props.match.params.article_id, this.props.match.params.version_number)
        .then((article) => (this.article = article))
        .catch((error) => Alert.danger('Error getting article: ' + error.message));
    } else {
      wikiService
        .getArticle(this.props.match.params.article_id)
        .then((article) => (this.article = article))
        .then(() => wikiService.viewArticle(this.article.article_id))
        .catch((error) => Alert.danger('Error getting article: ' + error.message));
    }

    wikiService
      .getComments(this.props.match.params.article_id)
      .then((comments) => (this.comments = comments))
      .catch((error) => Alert.danger('Error getting comments: ' + error.message));
  }
}

export class ArticleList extends Component {
  articles: Article[] = [];

  render() {
    return (
      <>
        <Card title="Articles">
          <Row>
            <Column>Article</Column>
            <Column>Last edited by</Column>
            <Column>Last edit at</Column>
          </Row>
          {this.articles.map((article, i) => (
            <Row key={i}>
              <Column>
                <NavLink
                  to={'/articles/' + article.article_id}
                  style={{ color: 'inherit', textDecoration: 'inherit' }}
                >
                  {article.title}
                </NavLink>
              </Column>

              <Column>{article.author}</Column>
              <Column>{new Date(article.edit_time).toLocaleString()}</Column>
            </Row>
          ))}
        </Card>
      </>
    );
  }

  mounted() {
    wikiService
      .getArticles()
      .then((articles) => {
        this.articles = articles;
      })
      .catch((error) => Alert.danger('Error getting articles: ' + error.message));
  }
}

export class VersionHistory extends Component<{ article_id: number }> {
  versions: Version[] = [];

  render() {
    return (
      <>
        <Card title="Version history:">
          {this.versions.map((version) => (
            <Row key={version.version_number}>
              <NavLink
                to={'/articles/' + this.props.article_id + '/version/' + version.version_number}
                style={{ color: 'inherit', textDecoration: 'inherit' }}
              >
                {version.version_type +
                  ' at: ' +
                  new Date(version.edit_time).toLocaleString() +
                  ' by: ' +
                  version.author +
                  ' version: ' +
                  version.version_number}
              </NavLink>
            </Row>
          ))}
        </Card>
      </>
    );
  }

  mounted() {
    wikiService
      .versionHistory(this.props.article_id)
      .then((versions) => {
        this.versions = versions;
      })
      .catch((error) => Alert.danger('Error getting versionhistory: ' + error.message));
  }
}

export class ArticleCreate extends Component {
  article: Article = {
    article_id: 0,
    title: '',
    content: '',
    author: 'anon',
    edit_time: 0,
    version_number: 0,
  };

  render() {
    return (
      <>
        <Card title="New article">
          <Row>
            <Column width={2}>
              <Form.Label>Title:</Form.Label>
            </Column>
            <Column>
              <Form.Input
                type="text"
                value={this.article.title}
                onChange={(event) => (this.article.title = event.currentTarget.value)}
              />
            </Column>
          </Row>
          <Row>
            <Column width={2}>
              <Form.Label>Content:</Form.Label>
            </Column>
            <Column>
              <Form.Textarea
                value={this.article.content}
                onChange={(e) => {
                  this.article.content = e.currentTarget.value;
                }}
                rows={10}
              />
            </Column>
          </Row>
        </Card>
        <Button.Success
          onClick={() => {
            const user = String(prompt('Username:'));
            this.article.author = user;
            wikiService
              .createArticle(this.article)
              .then(() => history.push('/'))
              .catch((error) => Alert.danger('Error creating article: ' + error.message));
          }}
        >
          Create
        </Button.Success>
      </>
    );
  }
}

export class ArticleEdit extends Component<{ match: { params: { article_id: number } } }> {
  article: Article = {
    article_id: 0,
    title: '',
    content: '',
    author: 'anon',
    edit_time: 0,
    version_number: 0,
  };

  render() {
    return (
      <>
        <Card title="Edit article">
          <Row>
            <Column width={2}>
              <Form.Label>Title:</Form.Label>
            </Column>
            <Column>
              <Form.Input
                type="text"
                value={this.article.title}
                onChange={(event) => (this.article.title = event.currentTarget.value)}
              />
            </Column>
          </Row>
          <Row>
            <Column width={2}>
              <Form.Label>Content:</Form.Label>
            </Column>
            <Column>
              <Form.Textarea
                value={this.article.content}
                onChange={(e) => {
                  this.article.content = e.currentTarget.value;
                }}
                rows={10}
              />
            </Column>
          </Row>
        </Card>
        <Button.Success
          onClick={() => {
            const user = String(prompt('Username:'));
            this.article.author = user;
            wikiService
              .createArticle(this.article)
              .then((article_id) => history.push('/articles/' + article_id))
              .catch((error) => Alert.danger('Error creating article: ' + error.message));
          }}
        >
          Save
        </Button.Success>
      </>
    );
  }

  mounted() {
    wikiService
      .getArticle(this.props.match.params.article_id)
      .then((article) => (this.article = article))
      .catch((error) => Alert.danger('Error getting article: ' + error.message));
  }
}

export class Login extends Component {
  render() {
    return (
      <div>
        <h1>Log in</h1>
      </div>
    );
  }
}
