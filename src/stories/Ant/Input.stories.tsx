import type { Meta, StoryObj } from '@storybook/react';
import { Input } from 'antd';

const meta: Meta<typeof Input> = {
  title: 'Ant/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      type: 'string',
      description: 'Тип тега input',
      defaultValue: 'text',
      control: { type: 'radio' },
      options: ['text', 'number', 'email', 'password', 'search', 'tel'],
    },
    size: {
      type: 'string',
      description: 'Размер',
      defaultValue: '',
      control: { type: 'radio' },
      options: ['large', 'middle', 'small'],
    },
    variant: {
      type: 'string',
      description: 'Вариант',
      defaultValue: 'outlined',
      control: { type: 'radio' },
      options: ['outlined', 'borderless', 'filled'],
    },
    status: {
      type: 'string',
      description: 'Статус валидации',
      defaultValue: '',
      control: { type: 'radio' },
      options: ['', 'error', 'warning'],
    },
    disabled: {
      control: 'boolean',
      description: 'Включен/Выключен',
      defaultValue: false,
    },
    showCount: {
      control: 'boolean',
      description: 'Показывает количество символов',
      defaultValue: false,
    },
    value: {
      type: 'string',
      description: 'Значение',
      defaultValue: 'Значение',
    },
    placeholder: {
      type: 'string',
      description: 'placeholder',
      defaultValue: 'Значение',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Outlined: Story = {
  args: {
    type: 'text',
    size: 'middle',
    variant: 'outlined',
    status: '',
    disabled: false,
    showCount: false,
    value: 'Ант Инпут',
    placeholder: 'Ант Инпут',
  },
};

export const Filled: Story = {
  name: 'Filled, large, with error and count',
  args: {
    type: 'text',
    size: 'large',
    variant: 'filled',
    status: 'error',
    disabled: false,
    showCount: true,
    value: 'Ант Инпут',
    placeholder: 'Ант Инпут',
  },
};
