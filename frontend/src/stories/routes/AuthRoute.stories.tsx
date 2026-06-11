import type { Meta, StoryObj } from '@storybook/react';
import { Route, Routes } from 'react-router-dom';
import AuthRoute from '../../routes/AuthRoute';
import { withAuth, withRouter } from '../decorators';

const AuthContent = () => <div>Страница входа / регистрации</div>;

const AuthRouteDemo = () => (
  <Routes>
    <Route element={<AuthRoute />}>
      <Route index element={<AuthContent />} />
    </Route>
    <Route path="/location" element={<div>Перенаправление на /location</div>} />
  </Routes>
);

const meta: Meta<typeof AuthRouteDemo> = {
  title: 'Routes/AuthRoute',
  component: AuthRouteDemo,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AuthRouteDemo>;

export const Guest: Story = {
  decorators: [withRouter(['/login']), withAuth(false)],
};

export const AuthenticatedRedirect: Story = {
  decorators: [withRouter(['/login']), withAuth(true)],
};
