import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">
        TanStack Start + GraphQL + TanStack Query
      </h1>
      <p className="mb-8 text-gray-600">
        This example demonstrates using tangrams with TanStack Start and
        TanStack Query for GraphQL data fetching.
      </p>

      <div className="space-y-4">
        <Link
          to="/pets"
          className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Pets &rarr;
          </h2>
          <p className="text-gray-600">
            Browse, view, and manage pets using GraphQL queries and mutations
            with TanStack Query.
          </p>
        </Link>
      </div>
    </div>
  );
}
