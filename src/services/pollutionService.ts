// src/services/PollutionService.ts
import axios from 'axios';
import { PollutionData } from '../types/types';
import { message } from 'antd';
import { extractErrorMessage } from '../utils/extractErrorMessage';

const OPENWEATHERMAP_API_KEY = process.env.REACT_APP_OPENWEATHERMAP_API_KEY || '';

export const getPollutionData = async (latitude: string, longitude: string): Promise<PollutionData> => {
    try {
		const response = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHERMAP_API_KEY}`);
		const pollutionComponents = response.data.list[0].components;
		const aqi = response.data.list[0].main.aqi;
		const dateTime = new Date(response.data.list[0].dt * 1000).toLocaleString();

		return {
			components: pollutionComponents,
			aqi,
			dateTime,
		};
	} catch (error) {
		console.error('Error fetching location data:', (error as any).message);
		//message.error('Ошибка при получении данных местоположения.');
		message.error(extractErrorMessage(error));
		throw error;
	}
};
