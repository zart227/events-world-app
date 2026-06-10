// src/components/Form/LocationInputForm.tsx
import React from 'react';
import { Form, Input, Button } from 'antd';

interface Props {
    onSubmit: (location: string) => void;
}

const LocationInputForm: React.FC<Props> = ({ onSubmit }) => {
    const [form] = Form.useForm();

    const handleFinish = (values: { location: string }) => {
        onSubmit(values.location);
        form.resetFields(); // Сбросить поля формы после отправки данных
    };

    return (
        <Form form={form} onFinish={handleFinish} layout="inline" style={{ marginBottom: '20px' }}>
            <Form.Item
                name="location"
                rules={[{ required: true, message: 'Пожалуйста, введите местоположение' }]}
            >
                <Input placeholder="Введите местоположение" style={{ width: '300px' }} />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit">
                    Искать
                </Button>
            </Form.Item>
        </Form>
    );
};

export default LocationInputForm;
