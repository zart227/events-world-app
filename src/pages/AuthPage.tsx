import React, { useState, useEffect } from 'react';
import { Tabs, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import AuthForm from '../components/Form/AuthForm';
import api from '../utils/api';
import { extractErrorMessage } from '../utils/extractErrorMessage';

const { TabPane } = Tabs;

const AuthPage: React.FC = () => {
  //const [isLogin, setIsLogin] = useState(useLocation().pathname === '/login');
  const [isLogin, setIsLogin] = useState<boolean>(true); // Установите изначальное значение входа
  
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuthContext();

  useEffect(() => {
    // Обновляем значение isLogin при изменении пути
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  const handleLoginFinish = async (values: any) => {
    try {
      const response = await api.post('/auth/login', values);
      if (response.status === 200) {
        message.success('Вход успешен');
        login(response.data, () => navigate('/location'));
      }
    } catch (error) {
        message.error(extractErrorMessage(error));
        message.error('Ошибка входа. Попробуйте снова.');
    }
  };

  const handleRegisterFinish = async (values: any) => {
    try {
      const response = await api.post('/auth/register', values);
      if (response.status === 201) {
        message.success('Регистрация успешна');
        login(response.data, () => navigate('/location'));
      }
    } catch (error) {
        message.error(extractErrorMessage(error));
        message.error('Ошибка регистрации. Попробуйте снова.');
    }
  };

  return (
    <div className="auth-container">
      <Tabs
        activeKey={isLogin ? 'login' : 'register'}
        onChange={(key) => {
          setIsLogin(key === 'login');
          navigate(key === 'login' ? '/login' : '/register');
        }}
      >
        <TabPane tab="Вход" key="login">
          <AuthForm mode="login" onFinish={handleLoginFinish} />
        </TabPane>
        <TabPane tab="Регистрация" key="register">
          <AuthForm mode="register" onFinish={handleRegisterFinish} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AuthPage;
