import request from 'supertest';
import type { Express } from 'express';

interface GraphQLResponse {
    data?: any;
    errors?: any[];
}

export async function graphqlQuery(
    app: Express,
    query: string,
    variables?: Record<string, any>,
    token?: string
): Promise<GraphQLResponse> {
    const req = request(app)
        .post('/graphql')
        .set('Content-Type', 'application/json');

    if (token) {
        req.set('Authorization', `Bearer ${token}`);
    }

    const res = await req.send({ query, variables });
    return res.body;
}

export async function graphqlMutation(
    app: Express,
    mutation: string,
    variables?: Record<string, any>,
    token?: string
): Promise<GraphQLResponse> {
    return graphqlQuery(app, mutation, variables, token);
}
