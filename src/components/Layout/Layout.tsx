import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AppHeader from '../Header/Header';

const { Header, Content, Footer } = Layout;

const AppLayout: React.FC = () => {


    return (
        <Layout className="layout">
            <Header>
                <AppHeader/>
            </Header>
            <Content style={{ padding: '0 50px' }}>
                <div className="site-layout-content">
                    <Outlet />
                </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>Сервис загрязненности воздуха ©2024 Created by WebSolutions</Footer>
        </Layout>
    );
};

export default AppLayout;
