import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';
import LocationInputPage from '../pages/LocationInputPage';
import CityInfoPage from '../pages/CityInfoPage';
import AboutPage from '../pages/AboutPage';
import Error404Page from '../pages/Error404Page';
import AppLayout from '../components/Layout/Layout';
import AuthRoute from '../routes/AuthRoute';
import PrivateRoute from '../routes/PrivateRoute';
import { AuthProvider } from '../context/AuthContext';
import ArticlesListPage from '../pages/Articles/ArticlesListPage'; 
import ArticlePage from '../pages/Articles/ArticlePage';
import ArticleCreatePage from '../pages/Articles/ArticleCreatePage'; // Import новых страниц

const MainRouter: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/location" />} />
            <Route path="/login" element={<AuthRoute />}>
              <Route path="" element={<AuthPage />} />
            </Route>
            <Route path="/register" element={<AuthRoute />}>
              <Route path="" element={<AuthPage />} />
            </Route>
            <Route path="/location" element={<PrivateRoute />}>
              <Route path="" element={<LocationInputPage />} />
            </Route>
            <Route path="/city-info" element={<PrivateRoute />}>
              <Route path="" element={<CityInfoPage />} />
            </Route>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/articles" element={<ArticlesListPage />} />
            <Route path="/articles/create" element={<ArticleCreatePage />} />
            <Route path="/articles/:id" element={<ArticlePage />} />
            <Route path="*" element={<Error404Page />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default MainRouter;
