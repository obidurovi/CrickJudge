import { configureStore } from '@reduxjs/toolkit';
import { simulationStorageApi } from './simulationStorageApi';
import simulationRuntimeReducer from './simulationRuntimeSlice';

export const store = configureStore({
    reducer: {
        [simulationStorageApi.reducerPath]: simulationStorageApi.reducer,
        simulationRuntime: simulationRuntimeReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(simulationStorageApi.middleware)
});
