import pool from './mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

type Article = {
  article_id: number;
  title: string;
  content: string;
  author: string;
  edit_time: number;
};
//version_type is either "created" or "edited"
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

class WikiService {
  getArticles() {
    return new Promise<Article[]>((resolve, reject) => {
      pool.query(
        'SELECT author, title, content, `edit_time`, article_id FROM Articles, Versions WHERE Articles.id = Versions.article_id AND is_newest_version = 1',
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);

          resolve(results as Article[]);
        },
      );
    });
  }
  getArticle(article_id: number) {
    return new Promise<Article | undefined>((resolve, reject) => {
      pool.query(
        'SELECT author, title, content, `edit_time`, article_id FROM Articles, Versions WHERE Articles.id = Versions.article_id AND is_newest_version = 1 AND Articles.id = ?',
        [article_id],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);

          resolve(results[0] as Article);
        },
      );
    });
  }

  getVersion(article_id: number, version_number: number) {
    return new Promise<Article | undefined>((resolve, reject) => {
      pool.query(
        'SELECT author, title, content, `edit_time`, article_id FROM Articles, Versions WHERE Articles.id = Versions.article_id AND Articles.id = ? AND version_number = ?',
        [article_id, version_number],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);

          resolve(results[0] as Article);
        },
      );
    });
  }

  viewArticle(article_id: number) {
    return new Promise<void>((resolve, reject) => {
      pool.query(
        'UPDATE `Articles` SET `views` = `views`+1 WHERE `id` = ?',
        [article_id],
        (error, results) => {
          if (error) return reject(error);

          resolve();
        },
      );
    });
  }

  versionHistory(article_id: number) {
    return new Promise<Version[]>((resolve, reject) => {
      pool.query(
        'SELECT author, edit_time, version_number, version_type FROM Versions WHERE article_id = ?',
        [article_id],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);

          resolve(results as Version[]);
        },
      );
    });
  }

  createArticle(article: Article) {
    return new Promise<number>((resolve, reject) => {
      const article_id = new Promise<number>((resolve, reject) => {
        pool.query(
          'INSERT INTO `Articles`(`views`) VALUES (0)',
          (error, results: ResultSetHeader) => {
            if (error) return reject(error);

            resolve(results.insertId);
          },
        );
      });
      article_id
        .then((id) => {
          pool.query(
            'INSERT INTO `Versions` (`author`,`content`,`edit_time`,`is_newest_version`,`article_id`,`title`,`version_type`,`version_number`) VALUES (?,?,?,1,?,?,"created",1)',
            [article.author, article.content, article.edit_time, id, article.title],
            (error, results: ResultSetHeader) => {
              if (error) return reject(error);

              resolve(id);
            },
          );
        })
        .catch((error) => reject(error));
    });
  }
  editArticle(article: Article) {
    return new Promise<number>((resolve, reject) => {
      const version_number = new Promise<number>((resolve, reject) => {
        pool.query(
          'SELECT `version_number` FROM `Versions` WHERE `is_newest_version` = 1 AND article_id = ?',
          [article.article_id],
          (error, results: RowDataPacket[]) => {
            if (error) return reject(error);

            resolve(results[0].version_number as number);
          },
        );
      });
      version_number
        .then((version_number) => {
          pool.query(
            'UPDATE `Versions` SET `is_newest_version`=0 WHERE `article_id` = ?',
            [article.article_id],
            (error, results: ResultSetHeader) => {
              if (error) return reject(error);
            },
          );
          pool.query(
            'INSERT INTO `Versions` (`author`,`content`,`edit_time`,`is_newest_version`,`article_id`,`title`,`version_type`,`version_number`) VALUES (?,?,?,1,?,?,"edited",?);',
            [
              article.author,
              article.content,
              article.edit_time,
              article.article_id,
              article.title,
              version_number + 1,
            ],
            (error, results: ResultSetHeader) => {
              if (error) return reject(error);

              resolve(article.article_id);
            },
          );
        })
        .catch((error) => reject(error));
    });
  }

  addComment(comment: Comment) {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'INSERT INTO `Comments` (`article_id`,`user`,`content`) VALUES (?,?,?);',
        [comment.article_id, comment.user, comment.content],
        (error, results: ResultSetHeader) => {
          if (error) return reject(error);
          // returns the id of the new comment
          resolve(results.insertId as number);
        },
      );
    });
  }

  getComments(article_id: number) {
    return new Promise<Comment[] | undefined>((resolve, reject) => {
      pool.query(
        'SELECT comment_id,article_id,  user, content FROM Comments WHERE article_id=? ',
        [article_id],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);

          resolve(results as Comment[]);
        },
      );
    });
  }

  deleteComment(comment_id: number) {
    return new Promise((resolve, reject) => {
      let message = " A comment is deleted";
      pool.query('DELETE FROM Comments WHERE comment_id = ?', [comment_id], (error) => {
        if (error) return reject(error);
        resolve(message);
      });
    });
  }

  editComment(comment: Comment) {
    return new Promise<void>((resolve, reject) => {
      pool.query(
        'UPDATE Comments SET content= ?  WHERE comment_id= ?;',
        [comment.content, comment.comment_id],
        (error, results) => {
          if (error) return reject(error);
          resolve();
        },
      );
    });
  }
}

const wikiService = new WikiService();
export default wikiService;
