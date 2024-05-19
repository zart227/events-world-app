// src/components/DataFetcher/DataFetcher.tsx
import React from 'react';
import axios from 'axios';
import { message } from 'antd';
import LocationInputForm from '../Form/LocationInputForm';

const YANDEX_API_KEY = process.env.REACT_APP_YANDEX_API_KEY || '';
const OPENWEATHERMAP_API_KEY = process.env.REACT_APP_OPENWEATHERMAP_API_KEY || '';

interface PollutionData {
    address: string;
    latitude: string;
    longitude: string;
    dateTime: string;
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
    aqi: number;
}

interface DataFetcherProps {
    onDataFetch: (data: PollutionData) => void;
}

const DataFetcher: React.FC<DataFetcherProps> = ({ onDataFetch }) => {
    const handleSearch = async (location: string) => {
        try {
            const geoResponse = await axios.get(`https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${location}&format=json`);
            const geoObject = geoResponse.data.response.GeoObjectCollection.featureMember[0].GeoObject;

            const coordinates = geoObject.Point.pos.split(' ');
            const address = geoObject.metaDataProperty.GeocoderMetaData.text;
            const lon = coordinates[0];  // Долгота
            const lat = coordinates[1];  // Широта

            const pollutionResponse = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}`);
            const pollutionComponents = pollutionResponse.data.list[0].components;
            const aqi = pollutionResponse.data.list[0].main.aqi;
            const dateTime = new Date(pollutionResponse.data.list[0].dt * 1000).toLocaleString();

            const formattedData = {
                address,
                latitude: lat,
                longitude: lon,
                dateTime,
                co: pollutionComponents.co,
                no: pollutionComponents.no,
                no2: pollutionComponents.no2,
                o3: pollutionComponents.o3,
                so2: pollutionComponents.so2,
                pm2_5: pollutionComponents.pm2_5,
                pm10: pollutionComponents.pm10,
                nh3: pollutionComponents.nh3,
                aqi,
            };

            onDataFetch(formattedData);
        } catch (error) {
            console.error('Error fetching data:', (error as any).message);
            message.error('Ошибка при получении данных.');
        }
    };

    return <LocationInputForm onSubmit={handleSearch} />;
};

export default DataFetcher;
