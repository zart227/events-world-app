import {useAuthContext} from "../../context/authContext";
import {useNavigate} from "react-router-dom";
import {NavLink, Link } from "react-router-dom";
import {Button, Flex, Menu, MenuProps} from "antd"

const items = new Array(3).fill(null).map((_, index) => ({
  key: String(index + 1),
  label: <NavLink to="/about">О сервисе</NavLink>, //`nav ${index + 1}`,
}));

export  function Header() {
    const navigate = useNavigate();
    const {isLogin, user, logout} = useAuthContext()

    const logoutHandler = () => {
        logout(() => {
            navigate('/auth')
        });
    }


    let topNavItems: MenuProps['items'] = [
        {
            key: 'about',
            label: (<NavLink to="/about">О сервисе</NavLink>)
        },
    ];

    if (isLogin) {
        topNavItems.push({
            key: 'home',
            label: (<NavLink to="/">Главная</NavLink>)
        })
    } else {
        topNavItems.push(
            {
                key: 'auth',
                label: (<NavLink to="/auth">Вход</NavLink>)
            },

        )
    }

    return (
      <Flex
        align={"center"}
        justify={"space-between"}
        // style={{width: '100%'}}
      >
        <Menu
          items={topNavItems}
          mode="horizontal"
          theme="dark"
          //defaultSelectedKeys={["about"]}
          disabledOverflow
        />
        
        {isLogin && user && (
          <Flex gap={"middle"} align={"center"}>
            <span style={{ color: "white" }}>{JSON.parse(user).email}</span>
            <Button onClick={logoutHandler} size={"small"} type={"primary"}>
              Выйти
            </Button>
          </Flex>
        )}
      </Flex>
    );
}
