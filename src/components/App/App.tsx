import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {AuthPage} from '../../pages/AuthPage';
import {HomePage} from '../../pages/HomePage';
import {ErrorPage} from '../../pages/ErrorPage';
import { AuthProvider, useAuthContext } from '../../context/authContext';
import Layout from '../Layout/Layout';
import { AboutPage } from '../../pages/AboutPage';

const PrivateRoute = () => {
    const { isLogin } = useAuthContext();
    return isLogin ? <HomePage /> : <Navigate to="/auth" />;
};

const App = () => {

    return (
        <AuthProvider>

            <Router>
                <Routes>
                    <Route path="/" element={<Layout/>}>
                        <Route index element={<PrivateRoute />} />
                        <Route path="auth" element={<AuthPage />} />
                        <Route path="about" element={<AboutPage />} />
                        <Route path="*" element={<ErrorPage />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
