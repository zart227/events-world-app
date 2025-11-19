import axios from 'axios';
import { message } from 'antd';
import { LocationData } from '../types/types';
import { extractErrorMessage } from '../utils/extractErrorMessage';

const YANDEX_API_KEY = process.env.REACT_APP_YANDEX_API_KEY || '';

export const getLocationData = async (location: string): Promise<LocationData> => {
    try {
        const response = await axios.get(`https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${location}&format=json`);
        const geoObjectCollection = response.data.response.GeoObjectCollection;

        if (geoObjectCollection.metaDataProperty.GeocoderResponseMetaData.found === "0") {
            message.error('Местоположение не найдено.');
            throw new Error('Местоположение не найдено');
        }

        const geoObject = geoObjectCollection.featureMember[0].GeoObject;
        const coordinates = geoObject.Point.pos.split(' ');
        const address = geoObject.metaDataProperty.GeocoderMetaData.text;
        const longitude = coordinates[0];  // Долгота
        const latitude = coordinates[1];  // Широта

        return { address, latitude, longitude };
    } catch (error) {
        console.error('Error fetching location data:', (error as any).message);
        //message.error('Ошибка при получении данных местоположения.');
        message.error(extractErrorMessage(error));
		throw error;
    }
};
