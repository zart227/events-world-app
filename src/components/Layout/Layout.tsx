import './Layout.css'
import {Outlet} from "react-router-dom";
import {Header as MyHeader} from "../Header/Header";
//import './App.css'

import { Layout as AntdLayout, theme } from 'antd';

const { Header, Footer, Content } = AntdLayout;

function Layout() {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    return (
      <AntdLayout style={{ minHeight: "100vh" }}>
        <Header>
          <MyHeader />
        </Header>
        <Content style={{ padding: "48px 48px 0 48px" }}>
          <div
            style={{
              background: colorBgContainer,
              minHeight: "calc(100vh - 181px)",
              padding: "24px 24px 0 24px",
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Сервис проверки загрязнения воздуха ©{new Date().getFullYear()}
        </Footer>
      </AntdLayout>
    );
}

export default Layout;


