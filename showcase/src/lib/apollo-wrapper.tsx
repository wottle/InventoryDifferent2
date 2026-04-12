"use client";
import { HttpLink, ApolloLink } from "@apollo/client";
import {
    ApolloNextAppProvider,
    NextSSRApolloClient,
    NextSSRInMemoryCache,
    SSRMultipartLink,
} from "@apollo/experimental-nextjs-app-support/ssr";
import { GRAPHQL_URL } from "./config";

function makeClient() {
    const httpLink = new HttpLink({ uri: GRAPHQL_URL });
    return new NextSSRApolloClient({
        cache: new NextSSRInMemoryCache(),
        link: typeof window === "undefined"
            ? ApolloLink.from([new SSRMultipartLink({ stripDefer: true }), httpLink])
            : httpLink,
    });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
    return (
        <ApolloNextAppProvider makeClient={makeClient}>
            {children}
        </ApolloNextAppProvider>
    );
}
