import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  deletePetMutationOptions,
  getPetByIdQueryOptions,
  getPetsQueryOptions,
} from "@/generated/pets/query/operations";

export const Route = createFileRoute("/pets/$petId/")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      getPetByIdQueryOptions({ id: params.petId }),
    );
  },
  component: PetDetailComponent,
});

function PetDetailComponent() {
  const { petId } = Route.useParams();
  const navigate = useNavigate();

  const {
    data: { pet },
  } = useSuspenseQuery(getPetByIdQueryOptions({ id: petId }));

  const deleteMutation = useMutation({
    ...deletePetMutationOptions(),
    onSuccess: (_d, _v, _r, { client }) => {
      client.invalidateQueries(getPetsQueryOptions());
      navigate({ to: "/pets" });
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${pet?.name}?`)) {
      deleteMutation.mutate({ id: petId });
    }
  };

  if (!pet) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <p className="text-gray-600">Pet not found</p>
        <Link to="/pets" className="text-purple-600 hover:underline">
          Back to pets
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <Link to="/pets" className="text-sm text-purple-600 hover:underline">
        &larr; Back to Pets
      </Link>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                GraphQL
              </span>
            </div>
            <p className="text-gray-600">{pet.category}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              pet.status === "available"
                ? "bg-green-100 text-green-800"
                : pet.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {pet.status}
          </span>
        </div>

        {pet.tags.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 font-semibold text-gray-700">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {pet.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {pet.photoUrl && (
          <div className="mb-4">
            <h2 className="mb-2 font-semibold text-gray-700">Photo</h2>
            <img
              src={pet.photoUrl}
              alt={pet.name}
              className="h-48 w-full rounded-lg object-cover"
            />
          </div>
        )}

        <div className="mb-4 text-sm text-gray-500">
          <p>Created: {new Date(pet.createdAt).toLocaleDateString()}</p>
          <p>Updated: {new Date(pet.updatedAt).toLocaleDateString()}</p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/pets/$petId/edit"
            params={{ petId }}
            className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            Edit Pet
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Pet"}
          </button>
        </div>

        {deleteMutation.isError && (
          <p className="mt-4 text-sm text-red-600">
            Error deleting pet. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
