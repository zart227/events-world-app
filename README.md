# Pollution Data App

This project is a web application for fetching and displaying air pollution data for various cities. It includes both frontend and backend components.

## Features

- Search for air pollution data by city name
- Display air pollution data in a table and chart
- Store and retrieve historical pollution data from a MongoDB database

## Prerequisites

- Node.js (v14 or later)
- MongoDB

## Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/pollution-data-app.git
    cd pollution-data-app
    ```

2. **Set up environment variables:**

    Create a `.env` file in the root directory of the project and add the following variables:

    ```env
    MONGO_URI=mongodb://localhost:27017
    DB_NAME=pollutionData
    SERVER_PORT=9100
    REACT_APP_YANDEX_GEOCODER_API_KEY=your_yandex_geocoder_api_key
    REACT_APP_OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
    ```

3. **Install dependencies:**

    ```bash
    npm install
    ```

4. **Set up the database:**

    ```bash
    npm run setup-db
    ```

5. **Build the frontend:**

    ```bash
    npm run build
    ```

6. **Start the application:**

    ```bash
    npm run start
    ```

    This command will start both the backend server and the React frontend.

## Additional Scripts

- **Start the backend server in development mode:**

    ```bash
    npm run dev
    ```

    This command starts the backend server using nodemon, which automatically restarts the server when changes are made to the code.

- **Start the React frontend in development mode:**

    ```bash
    npm run start-client
    ```

    This command starts only the React frontend in development mode. You can view it in your browser at [http://localhost:3000](http://localhost:3000).

## Folder Structure

- **backend**: Contains the backend server code and database setup script.
- **build**: Contains the production build of the React frontend.
- **public**: Contains the public assets for the React frontend.
- **src**: Contains the source code for the React frontend.
  - **components**: React components.
  - **pages**: React pages.
  - **services**: API service definitions.
  - **store**: Redux store setup.
  - **types**: TypeScript types.
  - **utils**: Utility functions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
