import { configureStore } from '@reduxjs/toolkit';
import { simulationStorageApi } from './simulationStorageApi';

export const store = configureStore({
    reducer: {
        [simulationStorageApi.reducerPath]: simulationStorageApi.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(simulationStorageApi.middleware)
});
