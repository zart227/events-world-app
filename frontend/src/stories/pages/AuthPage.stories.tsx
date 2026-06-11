import type { Meta, StoryObj } from '@storybook/react';
import AuthPage from '../../pages/AuthPage';
import { withAuth, withLayout, withRouter } from '../decorators';

const meta: Meta<typeof AuthPage> = {
  title: 'Pages/AuthPage',
  component: AuthPage,
  tags: ['autodocs'],
  decorators: [withAuth(false), withLayout(['/login']), withRouter(['/login'])],
};

export default meta;

type Story = StoryObj<typeof AuthPage>;

export const Login: Story = {};

export const Register: Story = {
  decorators: [withRouter(['/register']), withLayout(['/register'])],
};
