import React, { useState } from 'react';
import { Table } from 'antd';
import PollutionChart from '../components/PollutionChart/PollutionChart';
import { getLocationData } from '../services/locationService'; 
import { getPollutionData } from '../services/pollutionService'; 
import { formatPollutionData } from '../utils/formatPollutionData';
import { Columns } from '../components/columns/Columns'; 
import { CombinedData } from '../types/types';
import LocationInputForm from '../components/Form/LocationInputForm';

const LocationInputPage: React.FC = () => {
    const [data, setData] = useState<CombinedData[]>([]);

    const handleDataFetch = async (location: string) => {
        try {
            const locationData = await getLocationData(location);
            const pollutionData = await getPollutionData(locationData.latitude, locationData.longitude);
            const formattedData = formatPollutionData(locationData, pollutionData);

            setData((prevData) => [...prevData, formattedData]);
        } catch (error) {
            console.error('Error fetching data:', (error as any).message);
        }
    };

    return (
        <div>
            <LocationInputForm onSubmit={handleDataFetch} />
            <Table
                dataSource={data.map((item, index) => ({ ...item, key: index }))}
                columns={Columns}
            />
            <PollutionChart data={data} />
        </div>
    );
};

export default LocationInputPage;
