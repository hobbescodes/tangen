import {
  deleteUserMutationOptions,
  getUserQueryOptions,
  listUsersQueryOptions,
} from "@tangrams/users/query/operations";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$userId/")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      getUserQueryOptions({ userId: params.userId }),
    );
  },
  component: UserDetailComponent,
});

function UserDetailComponent() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();

  const { data: user } = useSuspenseQuery(getUserQueryOptions({ userId }));

  const deleteMutation = useMutation({
    ...deleteUserMutationOptions(),
    onSuccess: (_d, _v, _r, { client }) => {
      client.invalidateQueries(listUsersQueryOptions());
      navigate({ to: "/users" });
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteMutation.mutate({ userId });
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <p className="text-gray-600">User not found</p>
        <Link to="/users" className="text-blue-600 hover:underline">
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <Link to="/users" className="text-sm text-blue-600 hover:underline">
        &larr; Back to Users
      </Link>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                OpenAPI
              </span>
            </div>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              user.role === "admin"
                ? "bg-purple-100 text-purple-800"
                : user.role === "user"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {user.role}
          </span>
        </div>

        <div className="mb-4 text-sm text-gray-500">
          <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
          <p>Updated: {new Date(user.updatedAt).toLocaleDateString()}</p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/users/$userId/edit"
            params={{ userId }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Edit User
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete User"}
          </button>
        </div>

        {deleteMutation.isError && (
          <p className="mt-4 text-sm text-red-600">
            Error deleting user. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
