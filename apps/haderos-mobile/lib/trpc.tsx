import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import Constants from 'expo-constants';

// Valid type import will be configured later via Monorepo or Copy
// For now we use 'any' to ensure build passes during foundation
// import type { AppRouter } from '../../haderos-web/server/routers'; 
type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
    // Replace with your machine's IP if testing on real device
    // e.g., return 'http://192.168.1.5:3000';
    const localhost = Constants.platform?.android ? '10.0.2.2' : 'localhost';
    return `http://${localhost}:3000`;
};

export function TRPCProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            transformer: superjson,
            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/trpc`,
                }),
            ],
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    );
}
