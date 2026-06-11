import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const AuthRoute: React.FC = () => {
    const { isLogin } = useAuthContext();

    return isLogin ? <Navigate to="/location" /> : <Outlet />;
};

export default AuthRoute;
