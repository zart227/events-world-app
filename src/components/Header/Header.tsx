import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

const AppHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLogin, user, logout } = useAuthContext();
  const userData = user ? JSON.parse(user) : null;

  const getActiveMenuKey = (path: string) => {
    if (path === '/login') return 'login';
    if (path === '/register') return 'register';
    if (path.startsWith('/location')) return 'location';
    if (path.startsWith('/city-info')) return 'city-info';
    if (path === '/about') return 'about';
    return 'about';
  };

  const [activeMenuKey, setActiveMenuKey] = useState(getActiveMenuKey(location.pathname));

  useEffect(() => {
      setActiveMenuKey(getActiveMenuKey(location.pathname));
  }, [location.pathname]);


  const handleLogout = () => {
    logout(() => {
        navigate('/login');
    });
  };

  const handleMenuClick = (mode: 'login' | 'register') => {
    setActiveMenuKey(mode);
    navigate(mode === 'login' ? '/login' : '/register');
};

  return (
    <Menu theme="dark" mode="horizontal" selectedKeys={[activeMenuKey]}>
    <Menu.Item key="about">
        <Link to="/about">О нас</Link>
    </Menu.Item>
    {isLogin ? (
        <>
            <Menu.Item key="location">
                <Link to="/location">Местоположение</Link>
            </Menu.Item>
            <Menu.Item key="city-info">
                <Link to="/city-info">Информация о городе</Link>
            </Menu.Item>
            <Menu.Item key="email" style={{ marginLeft: 'auto' }}>
                {userData?.email}
            </Menu.Item>
            <Menu.Item key="logout" data-role="logout" onClick={handleLogout}>
                Выйти
            </Menu.Item>
        </>
    ) : (
        <>
            <Menu.Item key="login" style={{ marginLeft: 'auto' }} onClick={() => handleMenuClick('login')}>
                <Link to="/login">Вход</Link>
            </Menu.Item>
            <Menu.Item key="register" onClick={() => handleMenuClick('register')}>
                <Link to="/register">Регистрация</Link>
            </Menu.Item>
        </>
    )}
  </Menu>
  );
};

export default AppHeader;
