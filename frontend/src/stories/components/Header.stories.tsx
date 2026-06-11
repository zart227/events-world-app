import type { Meta, StoryObj } from '@storybook/react';
import AppHeader from '../../components/Header/Header';
import { withAuth, withRouter } from '../decorators';

const meta: Meta<typeof AppHeader> = {
  title: 'Components/Header',
  component: AppHeader,
  tags: ['autodocs'],
  decorators: [withRouter(['/about'])],
};

export default meta;

type Story = StoryObj<typeof AppHeader>;

export const Guest: Story = {
  decorators: [withAuth(false)],
};

export const Authenticated: Story = {
  decorators: [withAuth(true)],
};

export const OnLocationPage: Story = {
  decorators: [withRouter(['/location']), withAuth(true)],
};
