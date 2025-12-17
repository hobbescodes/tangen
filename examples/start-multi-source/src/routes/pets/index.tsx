import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { getPetsQueryOptions } from "@/generated/pets/query/operations";

export const Route = createFileRoute("/pets/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(
      getPetsQueryOptions({ limit: 20, offset: 0 }),
    );
  },
  component: PetsListComponent,
});

function PetsListComponent() {
  const {
    data: {
      pets: { data: pets, total },
    },
  } = useSuspenseQuery(getPetsQueryOptions({ limit: 20, offset: 0 }));

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-purple-600 hover:underline">
            &larr; Back to Home
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Pets</h1>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              GraphQL
            </span>
          </div>
          <p className="text-gray-600">{total} pets total</p>
        </div>
        <Link
          to="/pets/new"
          className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          Add Pet
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <Link
            key={pet.id}
            to="/pets/$petId"
            params={{ petId: pet.id }}
            className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">{pet.name}</h3>
            <p className="text-sm text-gray-600">{pet.category}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                pet.status === "available"
                  ? "bg-green-100 text-green-800"
                  : pet.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {pet.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
