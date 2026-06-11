import type { Meta, StoryObj } from '@storybook/react';
import { Table } from 'antd';
import { Columns } from '../../components/columns/Columns';
import { mockPollutionList } from '../fixtures/mockData';

const PollutionTable = () => (
  <Table
    columns={Columns}
    dataSource={mockPollutionList.map((item, index) => ({ ...item, key: index }))}
    scroll={{ x: true }}
  />
);

const meta: Meta<typeof PollutionTable> = {
  title: 'Components/PollutionTable',
  component: PollutionTable,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PollutionTable>;

export const Default: Story = {};
