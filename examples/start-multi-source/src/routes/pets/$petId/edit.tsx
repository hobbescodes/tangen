import { updatePetFormOptions } from "@tangrams/pets/form/forms";
import { updatePet } from "@tangrams/pets/functions";
import {
  getPetByIdQueryOptions,
  getPetsQueryOptions,
} from "@tangrams/pets/query/operations";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import type {
  PetCategory,
  PetStatus,
  UpdatePetMutationVariables,
} from "@tangrams/pets/schema";

export const Route = createFileRoute("/pets/$petId/edit")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      getPetByIdQueryOptions({ id: params.petId }),
    );
  },
  component: EditPetComponent,
});

function EditPetComponent() {
  const { petId } = Route.useParams();
  const navigate = useNavigate();

  const {
    data: { pet },
  } = useSuspenseQuery(getPetByIdQueryOptions({ id: petId }));

  const updatePetMutation = useMutation({
    mutationFn: updatePet,
    onSuccess: (_d, _v, _r, { client }) => {
      client.invalidateQueries(getPetByIdQueryOptions({ id: petId }));
      client.invalidateQueries(getPetsQueryOptions());
      navigate({ to: "/pets/$petId", params: { petId } });
    },
  });

  const defaultValues: UpdatePetMutationVariables = {
    id: petId,
    input: {
      name: pet?.name,
      category: pet?.category,
      status: pet?.status,
      photoUrl: pet?.photoUrl ?? undefined,
    },
  };

  const form = useForm({
    ...updatePetFormOptions,
    defaultValues,
    onSubmit: async ({ value }) => {
      await updatePetMutation.mutateAsync(value);
    },
  });

  if (!pet) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-gray-600">Pet not found</p>
        <Link to="/pets" className="text-purple-600 hover:underline">
          Back to pets
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link
        to="/pets/$petId"
        params={{ petId }}
        className="text-sm text-purple-600 hover:underline"
      >
        &larr; Back to {pet.name}
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Edit: {pet.name}</h1>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
          GraphQL
        </span>
      </div>
      <p className="mt-2 text-gray-600">
        Update pet information using a form with pre-populated values.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="mt-6 space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <form.Field name="input.name">
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                type="text"
                id={field.name}
                name={field.name}
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-600">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="input.category">
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <select
                id={field.name}
                name={field.name}
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value as PetCategory)
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="fish">Fish</option>
                <option value="reptile">Reptile</option>
              </select>
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-600">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="input.status">
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id={field.name}
                name={field.name}
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value as PetStatus)
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
              </select>
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-600">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="input.photoUrl">
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700"
              >
                Photo URL (optional)
              </label>
              <input
                type="url"
                id={field.name}
                name={field.name}
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value || undefined)
                }
                placeholder="https://example.com/photo.jpg"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-600">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <div className="flex gap-4">
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            )}
          </form.Subscribe>
          <Link
            to="/pets/$petId"
            params={{ petId }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>

        {updatePetMutation.isError && (
          <p className="text-sm text-red-600">
            Error updating pet. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
