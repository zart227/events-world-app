// src/pages/ArticleCreatePage.tsx
import React, { useEffect, useState } from 'react';
import { Button, Form, FormProps, Input, message } from 'antd';
import { useAddArticleMutation } from '../../services/articlesApi';
import { useNavigate } from 'react-router-dom';

type FieldType = {
  title: string;
  short_desc: string;
  description: string;
};

const ArticleCreatePage: React.FC = () => {
  const [form] = Form.useForm();
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [addArticle, { isLoading }] = useAddArticleMutation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const values = Form.useWatch([], form);

  useEffect(() => {
    form
		.validateFields({ validateOnly: true })
		.then(() => setSubmitDisabled(false))
		.catch(() => setSubmitDisabled(true));
  }, [form, values]);

  const submitHandler: FormProps<FieldType>['onFinish'] = (formData) => {
    addArticle(formData)
      .unwrap()
      .then((res) => {
        navigate(`/articles/${res.id}`);
      })
      .catch((error: any) => {
		const errorMessage = error.data?.message || '';

		// console.error(error);
        
		messageApi.open({
			type: 'error',
			content: `Неудалось создать статью! (${errorMessage})`,
		});	
      });
  };

  return (
    <>
      <h1>Создание статьи</h1>
	  {contextHolder}
	  <Form form={form} layout="vertical" style={{ maxWidth: 600 }} onFinish={submitHandler}>
        <Form.Item label="Заголовок" name="title" rules={[{ required: true, message: 'Укажите заголовок!' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Краткое описание" name="short_desc">
          <Input />
        </Form.Item>
        <Form.Item
          label="Текст статьи"
          name="description"
          rules={[{ required: true, message: 'Введите текст статьи!' }]}
        >
          <Input.TextArea autoSize={{ minRows: 5, maxRows: 10 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={submitDisabled} loading={isLoading}>
            Создать статью
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default ArticleCreatePage;
