import {createContext, useContext, useState, ReactNode} from "react";

interface LoginDataInterface {
    id: number,
    email: string,
}

interface AuthContextInterface {
    user: string | null,
    login: (user: LoginDataInterface, callback: VoidFunction) => void,
    logout: (callback: VoidFunction) => void,
    isLogin: boolean
}

const AuthContext = createContext<AuthContextInterface>(null!)
export const useAuthContext = () => useContext(AuthContext)

export const AuthProvider = ({children}:  { children: ReactNode }) => {
    // const navigate = useNavigate();
    const [user, setUser] = useState(window.localStorage.getItem('user') || null)

    const login = (data: LoginDataInterface, callback: VoidFunction) => {
        window.localStorage.setItem('user', JSON.stringify(data))
        setUser(JSON.stringify(data));

        callback();
    }
    const logout = (callback: VoidFunction) => {
        window.localStorage.removeItem('user')
        setUser(null);

        callback();
    }

    const isLogin = user !== null

    const authData = {
        user,
        login,
        logout,
        isLogin
    }

    return <AuthContext.Provider value={authData}>{children}</AuthContext.Provider>
}
