import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route } from 'react-router-dom';
import { ArticleList, ArticleCreate, ArticleEdit, ArticleDetails, Login } from './wiki-component';
import { Alert, NavPageHeader } from './widgets';

let root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <HashRouter>
      <>
        <Alert />
        <NavPageHeader />
        <Route exact path="/" component={ArticleList} />
        <Route exact path="/articles/:article_id(\d+)" component={ArticleDetails} />
        <Route
          exact
          path="/articles/:article_id(\d+)/version/:version_number(\d+)"
          component={ArticleDetails}
        />
        <Route exact path="/articles/new" component={ArticleCreate} />
        <Route exact path="/articles/:article_id(\d+)/edit" component={ArticleEdit} />
        <Route exact path="/login" component={Login} />
      </>
    </HashRouter>,
  );
