// src/pages/ArticlesListPage.tsx
import React from 'react';
import { Button, List, Spin, message } from 'antd';
import { Link } from 'react-router-dom';
import { useGetArticlesQuery, useDeleteAllArticlesMutation, useDeleteArticleMutation } from '../../services/articlesApi';

const ArticlesListPage: React.FC = () => {
  const { data: articles, isLoading, isFetching, refetch } = useGetArticlesQuery();
  const [clearArticles] = useDeleteAllArticlesMutation();
  const [deleteArticle] = useDeleteArticleMutation();

  const handleClearArticles = async () => {
    try {
      await clearArticles().unwrap();
      message.success("Список статей успешно очищен");
	  refetch();  // обновляем список статей
	} catch (error: any) {
		const errorMessage = error.data?.message || "";
		message.error(`Ошибка при очистке списка статей: ${errorMessage}`);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      await deleteArticle(id).unwrap();
      message.success("Статья успешно удалена");
	  refetch();  // обновляем список статей
	} catch (error: any) {
		const errorMessage = error.data?.message || "";
		message.error(`Ошибка при удалении статьи: ${errorMessage}`);    }
  };
  
  return (
    <>
      <h1>Список статей</h1>
	  <Button 
	  	type="primary" 
		onClick={handleClearArticles}
		style={{ marginBottom: '16px' }}
	  >
		Очистить список
	  </Button>
	  <p>
        <Link to="/articles/create">Создать новую статью...</Link>
      </p>
      <List
        itemLayout="horizontal"
        bordered={true}
        dataSource={articles}
        rowKey="id"
        loading={isLoading || isFetching}
        renderItem={(item) => (
          <List.Item
		  actions={[
			<Button danger onClick={() => handleDeleteArticle(item.id)}>Удалить</Button>
		  ]}
		>
            <List.Item.Meta
              title={<Link to={`/articles/${item.id}`}>{item.title}</Link>}
              description={item.short_desc}
            />
		</List.Item>
        )}
      />
    </>
  );
};

export default ArticlesListPage;
