// src/services/subscriptionsApi.ts — подписки на города (REST)
import api from '../utils/api';

export interface Subscription {
  id: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  created_at: string;
}

export const getSubscriptions = async (): Promise<Subscription[]> => {
  const { data } = await api.get<Subscription[]>('/subscriptions');
  return data;
};

export const subscribeToCity = async (city: string): Promise<Subscription> => {
  const { data } = await api.post<Subscription>('/subscriptions', { city });
  return data;
};

export const unsubscribeFromCity = async (id: string): Promise<void> => {
  await api.delete(`/subscriptions/${id}`);
};
