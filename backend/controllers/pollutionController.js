// controllers/pollutionController.js

const {
	insertPollutionData,
	getPollutionHistory,
} = require("../models/pollutionModel");

// Сохранение данных о загрязнении
const savePollutionData = async (req, res) => {
	const { address, latitude, longitude, components, aqi, dateTime } =
		req.body;

	if (
		!address ||
		!latitude ||
		!longitude ||
		!components ||
		!aqi ||
		!dateTime
	) {
		return res.status(400).json({
			message:
				"Необходимы все поля: address, latitude, longitude, components, aqi, dateTime",
		});
	}

	const newPollution = {
		address,
		latitude,
		longitude,
		components,
		aqi,
		dateTime,
		created_at: new Date(),
	};

	try {
		const result = await insertPollutionData(newPollution);
		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({
			message: "Ошибка при сохранении данных о загрязнении",
			error,
		});
	}
};

// Получение данных о загрязнении
const getPollutionData = async (req, res) => {
	try {
		const history = await getPollutionHistory();
		res.status(200).json(history);
	} catch (error) {
		res.status(500).json({
			message: "Ошибка при получении данных о загрязнении",
			error,
		});
	}
};

module.exports = {
	savePollutionData,
	getPollutionData,
};
