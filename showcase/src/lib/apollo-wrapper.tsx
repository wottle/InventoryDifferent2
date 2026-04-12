"use client";
import { HttpLink, ApolloLink, from } from "@apollo/client";
import {
    ApolloNextAppProvider,
    NextSSRApolloClient,
    NextSSRInMemoryCache,
    SSRMultipartLink,
} from "@apollo/experimental-nextjs-app-support/ssr";
import { GRAPHQL_URL } from "./config";

function makeClient() {
    const httpLink = new HttpLink({ uri: GRAPHQL_URL });

    const authLink = new ApolloLink((operation, forward) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('showcase_access_token');
            if (token) {
                operation.setContext({
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        }
        return forward(operation);
    });

    return new NextSSRApolloClient({
        cache: new NextSSRInMemoryCache(),
        link: typeof window === "undefined"
            ? ApolloLink.from([new SSRMultipartLink({ stripDefer: true }), httpLink])
            : from([authLink, httpLink]),
    });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
    return (
        <ApolloNextAppProvider makeClient={makeClient}>
            {children}
        </ApolloNextAppProvider>
    );
}
