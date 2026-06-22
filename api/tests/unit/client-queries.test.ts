import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, resolve, relative } from 'path';
import {
    buildASTSchema,
    parse,
    validate,
    FieldsOnCorrectTypeRule,
    KnownTypeNamesRule,
    KnownArgumentNamesRule,
    ScalarLeafsRule,
    type GraphQLSchema,
    type ValidationRule,
} from 'graphql';
import { typeDefs } from '../../src/typeDefs';

// Build a type-system-only schema from the API SDL. No resolvers are needed —
// we only validate the shape of client queries against the schema's types.
const schema: GraphQLSchema = buildASTSchema(typeDefs);

// Curated rule set focused on schema conformance — catches the bug class where
// a client query references a field/type/argument the schema does not have
// (e.g. querying `cpu` after it was renamed to `cpuType`). We deliberately omit
// the executable-document rules (unused fragments, unknown fragment spreads,
// undefined variables) so that queries which compose fragments defined in other
// files don't produce false positives when validated in isolation.
const CONFORMANCE_RULES: ValidationRule[] = [
    FieldsOnCorrectTypeRule,
    KnownTypeNamesRule,
    KnownArgumentNamesRule,
    ScalarLeafsRule,
];

const REPO_ROOT = resolve(__dirname, '../../..');
const CLIENT_DIRS = [join(REPO_ROOT, 'web/src'), join(REPO_ROOT, 'storefront/src')];

const IGNORED_DIRS = new Set(['node_modules', '.next', 'dist', '.turbo']);

function walk(dir: string): string[] {
    let files: string[] = [];
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return files; // directory may be absent in partial checkouts
    }
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (IGNORED_DIRS.has(entry.name)) continue;
            files = files.concat(walk(full));
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
            files.push(full);
        }
    }
    return files;
}

// Match `gql`...`` template literals. GraphQL bodies never contain a backtick,
// so a non-greedy "everything but backtick" capture is safe.
const GQL_RE = /\bgql`([^`]*)`/g;

interface Operation {
    file: string;
    body: string;
}

function collectOperations(): { ops: Operation[]; interpolatedSkipped: number } {
    const ops: Operation[] = [];
    let interpolatedSkipped = 0;
    for (const dir of CLIENT_DIRS) {
        for (const file of walk(dir)) {
            const src = readFileSync(file, 'utf8');
            let match: RegExpExecArray | null;
            GQL_RE.lastIndex = 0;
            while ((match = GQL_RE.exec(src)) !== null) {
                const body = match[1];
                // Documents that interpolate (`${FRAGMENT}`) aren't valid GraphQL
                // on their own and can't be parsed standalone — skip them.
                if (body.includes('${')) {
                    interpolatedSkipped++;
                    continue;
                }
                ops.push({ file, body });
            }
        }
    }
    return { ops, interpolatedSkipped };
}

function operationLabel(body: string): string {
    const named = body.match(/(query|mutation|subscription|fragment)\s+(\w+)/);
    if (named) return `${named[1]} ${named[2]}`;
    return body.trim().replace(/\s+/g, ' ').slice(0, 50);
}

const { ops } = collectOperations();

describe('client GraphQL queries validate against the API schema', () => {
    it('discovers gql operations in the web and storefront packages', () => {
        expect(ops.length).toBeGreaterThan(0);
    });

    for (const op of ops) {
        const rel = relative(REPO_ROOT, op.file);
        it(`${rel} :: ${operationLabel(op.body)}`, () => {
            const doc = parse(op.body);
            const errors = validate(schema, doc, CONFORMANCE_RULES);
            expect(errors.map((e) => e.message)).toEqual([]);
        });
    }
});
