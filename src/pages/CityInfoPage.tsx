import React, { useEffect, useState } from 'react';
import {Button, Form, type FormProps, Input, Table, message} from 'antd';
import { useSelector } from 'react-redux';
import { Columns } from '../components/columns/Columns';
import PollutionChart from '../components/PollutionChart/PollutionChart';
import { geocoderApi } from '../services/geocoder';
import { openWeatherMapApi } from '../services/openweathermap'; 
import {useAppDispatch} from "../store";
import { formatPollutionData } from '../utils/formatPollutionData';
import { getPollutionsList } from '../store/pollutionsSelectors';
import { setPollutionsList, addPollution } from '../store/pollutionsSlice';
import { LocationData, PollutionData } from '../types/types';
import dayjs from 'dayjs';
import { extractErrorMessage } from '../utils/extractErrorMessage';

const serverPort = process.env.REACT_APP_SERVER_PORT;
const serverAddress = `//localhost:${serverPort}`;

type FieldType = {
    address: string;
};

const CityInfoPage: React.FC = () => {
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const pollutions = useSelector(getPollutionsList);
    const [submitDisabled, setSubmitDisabled] = useState(true);
    const values = Form.useWatch([], form);

    useEffect(() => {
        try {
            fetch(`${serverAddress}/pollutions`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
                .then((res) => res.json())
                .then((data) => {
                    dispatch(setPollutionsList(data));
                });  
        } catch (error) {
            message.error('Ошибка получения данных с сервера!');
            message.error(extractErrorMessage(error));
        }

    }, [dispatch]);

    useEffect(() => {
        form.validateFields({ validateOnly: true })
            .then(() => setSubmitDisabled(false))
            .catch(() => setSubmitDisabled(true));
    }, [form, values]);

    const handleSuccessSubmit: FormProps<FieldType>["onFinish"] = async (formData) => {
        dispatch(geocoderApi.endpoints.getCoordsByAddress.initiate(formData.address))
            .then(({data})  => {
                const geocoderData = data;
                form.resetFields();
    
                if (geocoderData?.response.GeoObjectCollection.featureMember.length) {
                    const coords = geocoderData.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ');
                    const locationData: LocationData = {
                        address: geocoderData.response.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text,
                        latitude: coords[1],
                        longitude: coords[0],
                    };
    
                    dispatch(openWeatherMapApi.endpoints.getAirPollutionByCoords.initiate({ lat: locationData.latitude, lon: locationData.longitude }))
                        .then(({data}) => {
                            const pollutionData = data;
    
                            if (pollutionData) {
                                const pollutionDetails: PollutionData = {
                                    components: pollutionData.list[0].components,
                                    aqi: pollutionData.list[0].main.aqi,
                                    dateTime: dayjs.unix(pollutionData.list[0].dt ).format('DD.MM.YYYY HH:mm:ss'),
                                };
    
                                const newPollution = formatPollutionData(locationData, pollutionDetails);
                                dispatch(addPollution(newPollution));
                            }
                        })
                        .catch((error) => {
                            console.error('Ошибка при получении данных о загрязнении воздуха:', error);
                            message.error(extractErrorMessage(error));
                        });
                }
            })
            .catch((error) => {
                console.error('Ошибка при получении координат:', error);
                message.error(extractErrorMessage(error));
            });
    };
    

    return (
        <>
            <h1>Информация о городе</h1>
            <p>Функционал доработан с использованием Redux RTK Query. Результаты сохраняются в БД. Введите нужный адрес и нажмите на кнопку "Получить".</p>

            <Form
                form={form}
                layout={'vertical'}
                onFinish={handleSuccessSubmit}
                autoComplete="off"
            >
                <Form.Item
                    name="address"
                    rules={[
                        {
                            required: true,
                            message: 'Нужно ввести название города или адрес',
                        },
                        {
                            min: 3,
                            message: 'Минимум 3 символа',
                        },
                    ]}
                >
                    <Input placeholder="Введите название города или адрес" style={{ width: '300px' }} />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        disabled={submitDisabled}
                    >Получить</Button>
                </Form.Item>
            </Form>

            {!!pollutions.length &&
                <Table
                    columns={Columns}
                    dataSource={pollutions}
                    rowKey={(rec) => `${rec.address}_${rec.dateTime}`}
                    size={'small'}
                    scroll={{ x: true }}
                />
            }

            {!!pollutions.length &&
                <PollutionChart data={pollutions} />
            }
        </>
    );
};

export default CityInfoPage;
