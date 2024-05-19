// backend/controllers/authController.js
const { v4: uuidv4 } = require("uuid"); // для генерации уникальных ID

const { addUser, findUserByEmail } = require("../models/userModel");

const register = (req, res) => {
	const { email, password } = req.body;

	if (findUserByEmail(email)) {
		return res
			.status(400)
			.json({ message: "Пользователь с таким email уже существует" });
	}

	const newUser = { id: uuidv4(), email, password };
	addUser(newUser);
	res.status(201).json({ id: newUser.id, email: newUser.email });
	console.log("New user added!");
};

const login = (req, res) => {
	const { email, password } = req.body;
	const user = findUserByEmail(email);

	if (!user || user.password !== password) {
		return res.status(401).json({ message: "Неверный email или пароль" });
	}

	res.status(200).json({ id: user.id, email: user.email });
	console.log("Login successful!");
};

module.exports = {
	register,
	login,
};
