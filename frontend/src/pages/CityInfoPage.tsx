import React, { useEffect, useState, useCallback } from 'react';
import { Button, Form, type FormProps, Input, List, Space, Table, Tag, message } from 'antd';
import { useSelector } from 'react-redux';
import { Columns } from '../components/columns/Columns';
import PollutionChart from '../components/PollutionChart/PollutionChart';
import { useAppDispatch } from '../store';
import { getPollutionsList } from '../store/pollutionsSelectors';
import { setPollutionsList, addPollution, receivePollution } from '../store/pollutionsSlice';
import { CombinedData } from '../types/types';
import { extractErrorMessage } from '../utils/extractErrorMessage';
import api from '../utils/api';
import { getPollutionByCity } from '../services/pollutionService';
import {
    getSubscriptions,
    subscribeToCity,
    unsubscribeFromCity,
    Subscription,
} from '../services/subscriptionsApi';
import { getSocket, disconnectSocket } from '../services/socket';

type FieldType = {
    address: string;
};

const CityInfoPage: React.FC = () => {
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const pollutions = useSelector(getPollutionsList);
    const [submitDisabled, setSubmitDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const values = Form.useWatch([], form);

    useEffect(() => {
        api.get('/pollutions')
        .then(({ data }) => {
            dispatch(setPollutionsList(data));
        })
        .catch ((error: any) => {
            const errorMessage = error.response?.data?.message || "";

            message.error(`Ошибка получения данных с сервера: ${errorMessage}`);
            message.error(extractErrorMessage(error));
        })

    }, [dispatch]);

    const loadSubscriptions = useCallback(() => {
        getSubscriptions()
            .then(setSubscriptions)
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        loadSubscriptions();
    }, [loadSubscriptions]);

    // WebSocket: подписка на комнаты городов и приём push-обновлений
    useEffect(() => {
        const socket = getSocket();

        const onUpdate = (data: CombinedData) => {
            dispatch(receivePollution(data));
            message.info(`Обновлены данные по городу: ${data.address}`);
        };
        socket.on('pollution:update', onUpdate);
        subscriptions.forEach((sub) => socket.emit('city:subscribe', sub.city));

        return () => {
            socket.off('pollution:update', onUpdate);
            subscriptions.forEach((sub) => socket.emit('city:unsubscribe', sub.city));
        };
    }, [dispatch, subscriptions]);

    useEffect(() => () => disconnectSocket(), []);

    useEffect(() => {
        form.validateFields({ validateOnly: true })
            .then(() => setSubmitDisabled(false))
            .catch(() => setSubmitDisabled(true));
    }, [form, values]);

    const handleSuccessSubmit: FormProps<FieldType>["onFinish"] = async (formData) => {
        setLoading(true);
        try {
            // Геокодирование и запрос к OpenWeatherMap выполняет бэкенд (с кэшем в Redis)
            const data = await getPollutionByCity(formData.address);
            form.resetFields();
            dispatch(addPollution(data));
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "";

            console.error('Ошибка при получении данных о загрязнении воздуха:', errorMessage);
            message.error('Ошибка при получении данных о загрязнении воздуха!');
            if (errorMessage) message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        const city: string = form.getFieldValue('address');
        if (!city || city.trim().length < 2) {
            message.warning('Введите название города для подписки');
            return;
        }
        try {
            const sub = await subscribeToCity(city.trim());
            message.success(`Подписка на «${sub.city}» оформлена`);
            loadSubscriptions();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Не удалось оформить подписку');
        }
    };

    const handleUnsubscribe = async (sub: Subscription) => {
        try {
            await unsubscribeFromCity(sub.id);
            message.success(`Подписка на «${sub.city}» удалена`);
            loadSubscriptions();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Не удалось удалить подписку');
        }
    };

    return (
        <>
            <h1>Информация о городе</h1>
            <p>Введите название города — данные о загрязнении вернёт сервер (OpenWeatherMap + Redis-кэш). Подписавшись на город, вы будете получать обновления раз в час через WebSocket.</p>

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
                    <Space>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            disabled={submitDisabled}
                        >Получить</Button>
                        <Button onClick={handleSubscribe} disabled={submitDisabled}>
                            Подписаться на город
                        </Button>
                    </Space>
                </Form.Item>
            </Form>

            {!!subscriptions.length && (
                <List
                    header="Мои подписки (обновление раз в час + push)"
                    size="small"
                    bordered
                    style={{ maxWidth: 480, marginBottom: 24 }}
                    dataSource={subscriptions}
                    rowKey="id"
                    renderItem={(sub) => (
                        <List.Item
                            actions={[
                                <Button key="unsub" size="small" danger onClick={() => handleUnsubscribe(sub)}>
                                    Отписаться
                                </Button>,
                            ]}
                        >
                            <Tag color="blue">{sub.city}</Tag> {sub.address}
                        </List.Item>
                    )}
                />
            )}

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
