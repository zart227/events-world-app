import { createContext, useContext, useState, ReactNode } from "react";
import api from "../utils/api";
import { clearAuthStorage, setAccessToken } from "../utils/authToken";

export interface AuthUser {
    id: string;
    email: string;
    role: 'user' | 'admin';
}

export interface AuthResponse {
    user: AuthUser;
    accessToken: string;
}

interface AuthContextInterface {
    user: string | null;
    login: (data: AuthResponse, callback: VoidFunction) => void;
    logout: (callback: VoidFunction) => void;
    isLogin: boolean;
}

const AuthContext = createContext<AuthContextInterface>(null!);
export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<string | null>(window.localStorage.getItem('user'));

    const login = (data: AuthResponse, callback: VoidFunction) => {
        const serialized = JSON.stringify(data.user);
        window.localStorage.setItem('user', serialized);
        setAccessToken(data.accessToken);
        setUser(serialized);
        callback();
    };

    const logout = (callback: VoidFunction) => {
        // Отзываем refresh-токен на сервере; локальное состояние чистим в любом случае
        api.post('/auth/logout').catch(() => undefined);
        clearAuthStorage();
        setUser(null);
        callback();
    };

    const isLogin = user !== null;

    const authData = {
        user,
        login,
        logout,
        isLogin,
    };

    return <AuthContext.Provider value={authData}>{children}</AuthContext.Provider>;
};
