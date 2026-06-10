import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CombinedData } from "../../types/types";
import { message } from "antd";
import { extractErrorMessage } from "../../utils/extractErrorMessage";
import api from "../../utils/api";

const initialState = {
  list: [] as CombinedData[],
};

const pollutionSlice = createSlice({
  name: "pollutions",
  initialState,
  reducers: {
    setPollutionsList: (state, action: PayloadAction<CombinedData[]>) => {
      state.list = action.payload;
    },
    addPollution: (state, action: PayloadAction<CombinedData>) => {
      state.list = [action.payload, ...state.list];

      api.post('/pollutions', action.payload).catch((err) => {
        message.error(extractErrorMessage(err));
        console.error("Error:", err);
      });
    },
    // Запись, пришедшая с сервера (WebSocket push) — без повторного POST
    receivePollution: (state, action: PayloadAction<CombinedData>) => {
      state.list = [action.payload, ...state.list];
    },
  },
});

export const { setPollutionsList, addPollution, receivePollution } = pollutionSlice.actions;
export default pollutionSlice.reducer;
