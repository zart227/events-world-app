import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import fetch from 'cross-fetch';
import { CombinedData } from "../../types/types";
import { message } from "antd";
import { extractErrorMessage } from "../../utils/extractErrorMessage";

const initialState = {
  list: [] as CombinedData[],
};

const serverPort = process.env.REACT_APP_SERVER_PORT || '3001';
const serverAddress = `//localhost:${serverPort}/api`;

const pollutionSlice = createSlice({
  name: "pollutions",
  initialState,
  reducers: {
    setPollutionsList: (state, action: PayloadAction<CombinedData[]>) => {
      state.list = action.payload;
    },
    addPollution: (state, action: PayloadAction<CombinedData>) => {
      state.list = [action.payload, ...state.list];

      fetch(`${serverAddress}/pollutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.payload),
      }).catch((err) => {
        message.error(extractErrorMessage(err));
        console.error("Error:", err);
      });
    },
  },
});

export const { setPollutionsList, addPollution } = pollutionSlice.actions;
export default pollutionSlice.reducer;
