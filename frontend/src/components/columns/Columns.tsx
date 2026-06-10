// src/components/columns/Columns.tsx
import { Tag } from 'antd';
import { aqiColorMapping, aqiMapping } from '../../constants/constants';

export const Columns = [
    { title: 'Адрес', dataIndex: 'address', key: 'address' },
    { title: 'Широта', dataIndex: 'latitude', key: 'latitude' },
    { title: 'Долгота', dataIndex: 'longitude', key: 'longitude' },
    { title: 'Дата и время', dataIndex: 'dateTime', key: 'dateTime' },
    {
        title: 'Индекс качества воздуха',
        dataIndex: 'aqi',
        key: 'aqi',
        render: (aqi: number) => (
            <Tag color={aqiColorMapping[aqi]}>{aqiMapping[aqi] || 'Неизвестно'}</Tag>
        ),
    },
];
