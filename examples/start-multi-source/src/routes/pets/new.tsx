import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { createPetFormOptions } from "@/generated/pets/form/forms";
import {
  createPetMutationOptions,
  getPetsQueryOptions,
} from "@/generated/pets/query/operations";

import type {
  CreatePetMutationVariables,
  PetCategory,
  PetStatus,
} from "@/generated/pets/schema";

export const Route = createFileRoute("/pets/new")({
  component: NewPetComponent,
});

function NewPetComponent() {
  const navigate = useNavigate();

  const createPetMutation = useMutation({
    ...createPetMutationOptions(),
    onSuccess: (_d, _v, _r, { client }) => {
      client.invalidateQueries(getPetsQueryOptions());
      navigate({ to: "/pets" });
    },
  });

  const defaultValues: CreatePetMutationVariables = {
    input: {
      name: "",
      category: "dog",
      status: "available",
      tags: [],
      photoUrl: "",
    },
  };

  const form = useForm({
    ...createPetFormOptions,
    defaultValues,
    onSubmit: async ({ value }) => {
      await createPetMutation.mutateAsync(value);
    },
  });

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link to="/pets" className="text-sm text-purple-600 hover:underline">
        &larr; Back to Pets
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Create New Pet</h1>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
          GraphQL
        </span>
      </div>
      <p className="mt-2 text-gray-600">
        This form uses TanStack Form with Zod validation generated from the
        GraphQL schema.
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
                value={field.state.value}
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
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value as PetCategory)
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select a category</option>
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
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value as PetStatus)
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select a status</option>
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
                {isSubmitting ? "Creating..." : "Create Pet"}
              </button>
            )}
          </form.Subscribe>
          <Link
            to="/pets"
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>

        {createPetMutation.isError && (
          <p className="text-sm text-red-600">
            Error creating pet. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
