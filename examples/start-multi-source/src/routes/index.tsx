import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  head: () => ({
    meta: [{ title: "TanStack Start + Multi-Source Example" }],
  }),
});

function HomeComponent() {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-4xl font-bold text-gray-900">
        Multi-Source Example
      </h1>
      <p className="mb-8 text-lg text-gray-600">
        This example demonstrates using tangrams with multiple data sources in a
        single application. Pets are managed via{" "}
        <span className="font-semibold text-purple-600">GraphQL</span>, while
        Users are managed via{" "}
        <span className="font-semibold text-blue-600">OpenAPI/REST</span>.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* GraphQL Section - Pets */}
        <div className="rounded-lg border-2 border-purple-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
              GraphQL
            </span>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">Pets</h2>
          <p className="mb-4 text-gray-600">
            Manage pets using GraphQL queries and mutations with TanStack Query
            and Form.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/pets"
              className="block rounded-lg bg-purple-600 px-4 py-2 text-center text-white transition-colors hover:bg-purple-700"
            >
              Browse Pets
            </Link>
            <Link
              to="/pets/new"
              className="block rounded-lg border border-purple-300 px-4 py-2 text-center text-purple-700 transition-colors hover:bg-purple-50"
            >
              Create New Pet
            </Link>
          </div>
        </div>

        {/* OpenAPI Section - Users */}
        <div className="rounded-lg border-2 border-blue-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              OpenAPI
            </span>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">Users</h2>
          <p className="mb-4 text-gray-600">
            Manage users using REST endpoints with TanStack Query and Form.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/users"
              className="block rounded-lg bg-blue-600 px-4 py-2 text-center text-white transition-colors hover:bg-blue-700"
            >
              Browse Users
            </Link>
            <Link
              to="/users/new"
              className="block rounded-lg border border-blue-300 px-4 py-2 text-center text-blue-700 transition-colors hover:bg-blue-50"
            >
              Create New User
            </Link>
          </div>
        </div>
      </div>

      {/* Architecture Info */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          How It Works
        </h3>
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800">
              tangrams.config.ts - Multiple Sources
            </h4>
            <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-3 text-xs">
              {`sources: [
  {
    name: "pets",       // Generated to: src/generated/pets/
    type: "graphql",
    schema: { file: "schema.graphql" },
    documents: "./src/graphql/**/*.graphql",
    generates: ["query", "form"],
  },
  {
    name: "users",      // Generated to: src/generated/users/
    type: "openapi",
    spec: "openapi.yaml",
    generates: ["query", "form"],
  },
]`}
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Import Patterns</h4>
            <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-3 text-xs">
              {`// Pets (GraphQL)
import { getPetsQueryOptions } from "@/generated/pets/query/operations"
import { createPetFormOptions } from "@/generated/pets/form/forms"

// Users (OpenAPI)
import { listUsersQueryOptions } from "@/generated/users/query/operations"
import { createUserFormOptions } from "@/generated/users/form/forms"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
