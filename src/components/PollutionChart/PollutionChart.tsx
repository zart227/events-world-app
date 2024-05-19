// // src/components/PollutionChart/PollutionChart.tsx
// import React from 'react';
// import { Column } from '@ant-design/charts';

// interface PollutionData {
//     address: string;
//     co: number;
//     no: number;
//     no2: number;
//     o3: number;
//     so2: number;
//     pm2_5: number;
//     pm10: number;
//     nh3: number;
// }

// interface PollutionChartProps {
//     data: PollutionData[];
// }

// type ChartDataType = {
//     address: string;
//     parameter: string;
//     value: number;
// };

// const PollutionChart: React.FC<PollutionChartProps> = ({ data }) => {
//     const chartData: ChartDataType[] = data.flatMap((d) => [
//         { address: d.address, parameter: 'CO (угарный газ)', value: d.co },
//         { address: d.address, parameter: 'NO (оксид азота)', value: d.no },
//         { address: d.address, parameter: 'NO2 (диоксид азота)', value: d.no2 },
//         { address: d.address, parameter: 'O3 (озон)', value: d.o3 },
//         { address: d.address, parameter: 'SO2 (диоксид серы)', value: d.so2 },
//         { address: d.address, parameter: 'PM2.5 (мелкие частицы)', value: d.pm2_5 },
//         { address: d.address, parameter: 'PM10 (крупные частицы)', value: d.pm10 },
//         { address: d.address, parameter: 'NH3 (аммиак)', value: d.nh3 },
//     ]);

//     const chartConfig = {
//         height: 400,
//         xField: 'address',
//         yField: 'value',
//         stack: 'true',
//         colorField: 'parameter',
//         axis: {
//             x: { title: 'Адрес' },
//             y: { title: 'Концентрация в мкг/куб.м' },
//         },
//         legend: {
//             position: 'top',
//         },
//     };

//     return <Column data={chartData} {...chartConfig} />;
// };

// export default PollutionChart;

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
