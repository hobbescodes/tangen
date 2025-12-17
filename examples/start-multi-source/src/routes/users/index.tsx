import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { listUsersQueryOptions } from "@/generated/users/query/operations";

export const Route = createFileRoute("/users/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(
      listUsersQueryOptions({ limit: 20, offset: 0 }),
    );
  },
  component: UsersListComponent,
});

function UsersListComponent() {
  const {
    data: { data: users, total },
  } = useSuspenseQuery(listUsersQueryOptions({ limit: 20, offset: 0 }));

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            &larr; Back to Home
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              OpenAPI
            </span>
          </div>
          <p className="text-gray-600">{total} users total</p>
        </div>
        <Link
          to="/users/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add User
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Link
            key={user.id}
            to="/users/$userId"
            params={{ userId: user.id }}
            className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                user.role === "admin"
                  ? "bg-purple-100 text-purple-800"
                  : user.role === "user"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {user.role}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
