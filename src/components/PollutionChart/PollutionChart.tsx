// src/components/PollutionChart/PollutionChart.tsx
import React from 'react';
import { Column } from '@ant-design/charts';
import { CombinedData, ChartDataType } from '../../types/types';
import { chartConfig } from '../../constants/constants'; 
import { generateChartData } from '../../utils/generateChartData';

interface PollutionChartProps {
    data: CombinedData[];
}

const PollutionChart: React.FC<PollutionChartProps> = ({ data }) => {
    const chartData: ChartDataType[] = generateChartData(data);

    return <Column data={chartData} {...chartConfig} />;
};

export default PollutionChart;
