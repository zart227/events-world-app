import React from 'react';
import { Form, Input, Button } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';

interface AuthFormProps {
  mode: 'login' | 'register';
  onFinish: (values: any) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onFinish }) => {
  const [form] = Form.useForm();

  // Custom validation for password confirmation
  const validateConfirmPassword = (rule: any, value: any) => {
    if (mode === 'register' && value !== form.getFieldValue('password')) {
      return Promise.reject('Пароли не совпадают');
    }
    return Promise.resolve();
  };

  return (
    <Form
      form={form}
      name="authForm"
      onFinish={onFinish}
      initialValues={{ remember: true }}
      layout="vertical"
      style={{ maxWidth: 400 }}
    >
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Пожалуйста, введите ваш email' },
          { type: 'email', message: 'Некорректный email' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" />
      </Form.Item>
      <Form.Item
        name="password"
        label="Пароль"
        rules={[
          { required: true, message: 'Пожалуйста, введите ваш пароль' },
          { min: 6, message: 'Пароль должен быть минимум 6 символов' },
          { pattern: /^[a-z]+$/, message: 'Пароль должен содержать только английские буквы в нижнем регистре' },
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
      </Form.Item>
      {mode === 'register' && (
        <Form.Item
          name="confirmPassword"
          label="Подтверждение пароля"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Пожалуйста, подтвердите ваш пароль' },
            { validator: validateConfirmPassword },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Подтверждение пароля" />
        </Form.Item>
      )}
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AuthForm;
