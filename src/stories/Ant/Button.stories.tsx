import type { Meta, StoryObj } from '@storybook/react';
import { Button } from 'antd';

const meta: Meta<typeof Button> = {
  title: 'Ant/Button',
  component: Button,
  render: ({ children, ...args }) => <Button {...args}>{children}</Button>,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    type: {
      type: 'string',
      description: 'Тип внешнего вида',
      defaultValue: 'primary',
      control: { type: 'radio' },
      options: ['primary', 'default', 'dashed', 'text', 'link'],
    },
    size: {
      type: 'string',
      description: 'Размер',
      defaultValue: 'default',
      control: { type: 'radio' },
      options: ['large', 'default', 'small'],
    },
    shape: {
      type: 'string',
      description: 'Форма',
      defaultValue: 'default',
      control: { type: 'radio' },
      options: ['default', 'circle', 'round'],
    },
    ghost: {
      control: 'boolean',
      description: 'Делает кнопку прозрачной',
      defaultValue: false,
    },
    loading: {
      control: 'boolean',
      description: 'Статус загрузки',
      defaultValue: false,
    },
    danger: {
      control: 'boolean',
      description: 'Делает кнопку красной',
      defaultValue: false,
    },
    disabled: {
      control: 'boolean',
      description: 'Включен/Выключен',
      defaultValue: false,
    },
    block: {
      control: 'boolean',
      description: 'Блок/Не блок',
      defaultValue: false,
    },
    htmlType: {
      type: 'string',
      description: 'HTML-тип кнопки',
      defaultValue: 'button',
      control: { type: 'radio' },
      options: ['button', 'submit', 'reset'],
    },
    children: {
      type: 'string',
      description: 'Текст кнопки',
      defaultValue: 'Кнопка',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    type: 'primary',
    children: 'Ант Дизайн',
  },
};

export const Default: Story = {
  args: {
    type: 'default',
    children: 'Ант Дизайн',
  },
};

export const Dashed: Story = {
  args: {
    type: 'dashed',
    children: 'Ант Дизайн',
  },
};

export const Text: Story = {
  args: {
    type: 'text',
    children: 'Ант Дизайн',
  },
};

export const Link: Story = {
  args: {
    type: 'link',
    children: 'Ант Дизайн',
  },
};
