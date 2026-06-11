import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const PrivateRoute: React.FC = () => {
    const { isLogin } = useAuthContext();

    return isLogin ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
