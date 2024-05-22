import React, { useState, useEffect } from 'react';
import { Input, Button, Table, message } from 'antd';
import { useGetCoordsByAddressQuery } from '../services/geocoder';
import { useGetAirPollutionByCoordsQuery } from '../services/openweathermap';
import { useSaveHistoryMutation, useGetHistoryQuery } from '../services/api';
import { Columns } from '../components/columns/Columns';
import { CombinedData, PollutionData } from '../types/types';
import { formatPollutionData } from '../utils/formatPollutionData';
import PollutionChart from '../components/PollutionChart/PollutionChart';
import { convertPollutionData } from '../utils/convertPollutionData';

const CityInfoPage: React.FC = () => {
    const [location, setLocation] = useState('');
    const [city, setCity] = useState('');
    const [pollutionDataToSave, setPollutionDataToSave] = useState<CombinedData | undefined>(undefined);
    const [cityToSave, setCityToSave] = useState<string>('');
    const [locationLoaded, setLocationLoaded] = useState<boolean>(false);
    const [pollutionLoaded, setPollutionLoaded] = useState<boolean>(false);
    const [isDataSaved, setIsDataSaved] = useState<boolean>(false);

    const { data: locationData, error: locationError, isFetching: isFetchingLocation } = useGetCoordsByAddressQuery(city, { skip: !city });
    const { data: pollutionApiResponse, error: pollutionError, isFetching: isFetchingPollution } = useGetAirPollutionByCoordsQuery(
        { lat: locationData?.response?.GeoObjectCollection?.featureMember[0]?.GeoObject?.Point.pos.split(' ')[1] || '', lon: locationData?.response?.GeoObjectCollection?.featureMember[0]?.GeoObject?.Point.pos.split(' ')[0] || '' },
        { skip: !locationData?.response?.GeoObjectCollection?.featureMember[0]?.GeoObject?.Point.pos }
    );
    const [saveHistory, { error: saveError }] = useSaveHistoryMutation();
    const { data: historyData, error: historyError } = useGetHistoryQuery();

    const pollutionData: PollutionData | undefined = pollutionApiResponse ? convertPollutionData(pollutionApiResponse) : undefined;

    useEffect(() => {
        if (locationData && city) {
            setLocationLoaded(true);
        } else {
            setLocationLoaded(false);
        }
    }, [locationData, city]);

    useEffect(() => {
        if (pollutionData) {
            setPollutionLoaded(true);
        } else {
            setPollutionLoaded(false);
        }
    }, [pollutionData]);

    useEffect(() => {
        if (locationLoaded && pollutionLoaded && !isDataSaved && locationData) {
            const locationCoords = locationData.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ');
            const locationInfo = {
                address: locationData.response.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text,
                latitude: locationCoords[1],
                longitude: locationCoords[0],
            };
            const formattedData = formatPollutionData(locationInfo, pollutionData!);
            setPollutionDataToSave(formattedData); // Установка данных о загрязнении воздуха для отправки на бэкенд
            setCityToSave(city); // Установка города для отправки на бэкенд
            setIsDataSaved(true); // Установка флага отправки данных

            const saveData = async () => {
                try {
                    await saveHistory({ location: city, pollutionData: formattedData });
                    setIsDataSaved(false); // Сброс флага отправки данных после успешного запроса
                } catch (error) {
                    console.error('Error saving history data:', error);
                }
            };
            saveData();
        }
    }, [locationLoaded, pollutionLoaded, isDataSaved, locationData, pollutionData, city, saveHistory]);

    const handleSearch = () => {
        setCity(location);
        setLocationLoaded(false); // Сброс состояния загрузки данных перед новым поиском
        setPollutionLoaded(false); // Сброс состояния загрузки данных перед новым поиском
        setIsDataSaved(false); // Сброс флага отправки данных перед новым поиском
    };

    useEffect(() => {
        if (locationError) {
            message.error('Error fetching location data');
        }
        if (pollutionError) {
            message.error('Error fetching pollution data');
        }
        if (saveError) {
            message.error('Error saving history data');
        }
        if (historyError) {
            message.error('Error fetching history data');
        }
    }, [locationError, pollutionError, saveError, historyError]);

    const formattedData: CombinedData[] = locationData && pollutionData ? [
        formatPollutionData({
            address: locationData.response.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text,
            latitude: locationData.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ')[1],
            longitude: locationData.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ')[0],
        }, pollutionData)
    ] : [];

    return (
        <div>
            <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Введите название города"
                style={{ width: '300px', marginRight: '10px' }}
            />
            <Button type="primary" onClick={handleSearch}>
                Искать
            </Button>
            <Table
                dataSource={formattedData.map((item, index) => ({ ...item, key: index }))}
                columns={Columns}
            />
            <PollutionChart data={formattedData} />
            {!!historyData && (
                <div>
                    <h2>History</h2>
                    <Table
                        dataSource={historyData.map((item, index) => ({ ...item, key: index }))}
                        columns={Columns}
                    />
                </div>
            )}
        </div>
    );
};

export default CityInfoPage;
