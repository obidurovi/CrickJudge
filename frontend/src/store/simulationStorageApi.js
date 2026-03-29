import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

const STORAGE_KEY = 'crickjudge:last-simulation';

const readStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const writeStorage = (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const simulationStorageApi = createApi({
    reducerPath: 'simulationStorageApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['LastSimulation'],
    endpoints: (builder) => ({
        getLastSimulation: builder.query({
            queryFn: async () => {
                const data = readStorage();
                return { data };
            },
            providesTags: ['LastSimulation']
        }),
        saveLastSimulation: builder.mutation({
            queryFn: async (simulationPayload) => {
                writeStorage(simulationPayload);
                return { data: { ok: true, savedAt: new Date().toISOString() } };
            },
            invalidatesTags: ['LastSimulation']
        }),
        clearLastSimulation: builder.mutation({
            queryFn: async () => {
                localStorage.removeItem(STORAGE_KEY);
                return { data: { ok: true } };
            },
            invalidatesTags: ['LastSimulation']
        })
    })
});

export const {
    useLazyGetLastSimulationQuery,
    useSaveLastSimulationMutation,
    useClearLastSimulationMutation
} = simulationStorageApi;
