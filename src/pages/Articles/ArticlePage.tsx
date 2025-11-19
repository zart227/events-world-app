// src/pages/ArticlePage.tsx
import React from 'react';
import { Button, Spin, message } from "antd";
import dayjs from 'dayjs';
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetArticleQuery, useDeleteArticleMutation } from '../../services/articlesApi';

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: any }>();
  const { data: article, isLoading, isFetching } = useGetArticleQuery(id);
  const navigate = useNavigate();
  const [deleteArticle] = useDeleteArticleMutation();

  const handleDelete = async () => {
    try {
      await deleteArticle(id).unwrap();
      message.success("Статья успешно удалена");
      navigate("/articles");
    } catch (error) {
      message.error("Ошибка при удалении статьи");
    }
  };
  
  if (isLoading) return <Spin size="large" />;
  if (!article) return <div>Статья не найдена</div>;

  return (
    <>
      <h1>{article.title} {isFetching ? <Spin /> : ''}</h1>
      <div>
        <i>{dayjs(article.created_at).format('DD.MM.YYYY HH:mm')}</i>
      </div>
      <div>
        {article.description?.split('\n').map((paragraph, i) => (
          <p key={`description_p_${i}`}>{paragraph}</p>
        ))}
      </div>
	  <Link to="/articles">Вернуться к списку статей</Link>
      <div>
	  <Button 
	    type="primary" 
	    onClick={handleDelete}
		style={{marginTop: '16px' }}
	  >
		Удалить статью
	  </Button>
	  </div>
    </>
  );
};

export default ArticlePage;
