"use client";

import { HttpLink, ApolloLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import {
    ApolloNextAppProvider,
    ApolloClient,
    InMemoryCache,
    SSRMultipartLink,
} from "@apollo/client-integration-nextjs";
import { GRAPHQL_URL } from "./config";

// Token storage key (matches auth-context.tsx)
const ACCESS_TOKEN_KEY = 'inv_access_token';

function makeClient() {
    const httpLink = new HttpLink({
        uri: GRAPHQL_URL,
    });

    // Auth link that adds the Authorization header
    const authLink = setContext((_, { headers }) => {
        // Get the authentication token from localStorage
        const token = typeof window !== 'undefined'
            ? localStorage.getItem(ACCESS_TOKEN_KEY)
            : null;

        return {
            headers: {
                ...headers,
                authorization: token ? `Bearer ${token}` : '',
            },
        };
    });

    return new ApolloClient({
        cache: new InMemoryCache(),
        link:
            typeof window === "undefined"
                ? ApolloLink.from([
                    new SSRMultipartLink({
                        stripDefer: true,
                    }),
                    httpLink,
                ])
                : ApolloLink.from([authLink, httpLink]),
    });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
    return (
        <ApolloNextAppProvider makeClient={makeClient}>
            {children}
        </ApolloNextAppProvider>
    );
}
