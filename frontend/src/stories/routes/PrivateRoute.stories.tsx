import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from '../../routes/PrivateRoute';
import { withAuth, withRouter } from '../decorators';

const ProtectedContent = () => <div>Защищённый контент</div>;

const PrivateRouteDemo = () => (
  <Routes>
    <Route element={<PrivateRoute />}>
      <Route index element={<ProtectedContent />} />
    </Route>
  </Routes>
);

const meta: Meta<typeof PrivateRouteDemo> = {
  title: 'Routes/PrivateRoute',
  component: PrivateRouteDemo,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PrivateRouteDemo>;

export const Authenticated: Story = {
  decorators: [withRouter(['/']), withAuth(true)],
};

export const GuestRedirect: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route index element={<ProtectedContent />} />
          </Route>
          <Route path="/login" element={<div>Перенаправление на /login</div>} />
        </Routes>
      </MemoryRouter>
    ),
    withAuth(false),
  ],
};
