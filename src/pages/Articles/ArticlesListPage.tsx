// src/pages/ArticlesListPage.tsx
import React, { useState } from 'react';
import { Button, Input, List, Select, Space, message } from 'antd';
import { Link } from 'react-router-dom';
import { useGetArticlesQuery, useDeleteAllArticlesMutation, useDeleteArticleMutation } from '../../services/articlesApi';
import { ArticlesSort } from '../../types/types';

const PAGE_SIZE = 10;

const ArticlesListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ArticlesSort>('created_at:desc');
  const [search, setSearch] = useState<string>('');

  const { data, isLoading, isFetching, refetch } = useGetArticlesQuery({
    page,
    limit: PAGE_SIZE,
    sort,
    ...(search ? { q: search } : {}),
  });
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
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Поиск по статьям"
          allowClear
          style={{ width: 280 }}
          onSearch={(value) => {
            setPage(1);
            setSearch(value.trim());
          }}
        />
        <Select<ArticlesSort>
          value={sort}
          style={{ width: 220 }}
          onChange={(value) => {
            setPage(1);
            setSort(value);
          }}
          options={[
            { value: 'created_at:desc', label: 'Сначала новые' },
            { value: 'created_at:asc', label: 'Сначала старые' },
            { value: 'title:asc', label: 'По заголовку (А-Я)' },
            { value: 'title:desc', label: 'По заголовку (Я-А)' },
          ]}
        />
      </Space>
      <List
        itemLayout="horizontal"
        bordered={true}
        dataSource={data?.items}
        rowKey="id"
        loading={isLoading || isFetching}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          showSizeChanger: false,
          onChange: (newPage) => setPage(newPage),
        }}
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
