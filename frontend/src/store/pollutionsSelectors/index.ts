import { RootState } from '../index';

export const getPollutionsList = (store: RootState) => store.pollutions.list;
