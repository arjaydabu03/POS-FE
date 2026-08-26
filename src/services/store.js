import { configureStore } from "@reduxjs/toolkit";
import { POSAPI } from "../Api/store";


export const store = configureStore({
  reducer: {
    // theme: themeSlice,
    // auth: authSlice,
    // drawer: drawerSlice,
    // render: renderSlice,
    // filter: filterSlice,
    // modal: modalSlice,
    // system: systemSlice,

    [POSAPI.reducerPath]: POSAPI.reducer,
    // [systemAPI.reducerPath]: systemAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([POSAPI.middleware]),
});