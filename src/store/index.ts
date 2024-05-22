import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import {useDispatch} from "react-redux";
import { geocoderApi } from "../services/geocoder";
import { openWeatherMapApi } from "../services/openweathermap";
import pollutionsSlice from "./pollutionsSlice";

export const store = configureStore({
	reducer: {
		// Добавляем редюсеры для сервисов
		[geocoderApi.reducerPath]: geocoderApi.reducer,
		[openWeatherMapApi.reducerPath]: openWeatherMapApi.reducer,
		pollutions: pollutionsSlice,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware()
			.concat(geocoderApi.middleware)
			.concat(openWeatherMapApi.middleware)
});

// Настройка listeners для автоматического обновления
setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export type RootState = ReturnType<typeof store.getState>;
