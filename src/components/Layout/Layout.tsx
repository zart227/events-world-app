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
        <Header >
          <MyHeader />
        </Header>
        <Content style={{ padding: "48px" }}>
          <div
            style={{
              background: colorBgContainer,
              minHeight: "calc(100vh - 224px)",
              padding: 24,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer style={{ color: "rgba(255, 255, 255, 0.65)" }}>
          {new Date().getFullYear()}
        </Footer>
      </AntdLayout>
    );
}

export default Layout;


