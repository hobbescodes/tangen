import { createUserFormOptions } from "@tangrams/users/form/forms";
import {
  createUserMutationOptions,
  listUsersQueryOptions,
} from "@tangrams/users/query/operations";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import type { CreateUserRequest, UserRole } from "@tangrams/users/schema";

export const Route = createFileRoute("/users/new")({
  component: NewUserComponent,
});

function NewUserComponent() {
  const navigate = useNavigate();

  const createUserMutation = useMutation({
    ...createUserMutationOptions(),
    onSuccess: (_d, _v, _r, { client }) => {
      client.invalidateQueries(listUsersQueryOptions());
      navigate({ to: "/users" });
    },
  });

  const defaultValues: CreateUserRequest = {
    name: "",
    email: "",
    role: "guest",
  };

  const form = useForm({
    ...createUserFormOptions,
    defaultValues,
    onSubmit: async ({ value }) => {
      await createUserMutation.mutateAsync({ body: value });
    },
  });

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link to="/users" className="text-sm text-blue-600 hover:underline">
        &larr; Back to Users
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          OpenAPI
        </span>
      </div>
      <p className="mt-2 text-gray-600">
        This form uses TanStack Form with Zod validation generated from the
        OpenAPI schema.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="mt-6 space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <form.Field name="name">
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
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-600">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="user@example.com"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-600">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="role">
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <select
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value as UserRole)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="guest">Guest</option>
              </select>
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
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </button>
            )}
          </form.Subscribe>
          <Link
            to="/users"
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>

        {createUserMutation.isError && (
          <p className="text-sm text-red-600">
            Error creating user. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
