export type UserRole = "admin" | "user" | "guest";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export const users: User[] = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    email: "john@example.com",
    name: "John Doe",
    role: "user",
    createdAt: "2024-01-05T10:00:00Z",
    updatedAt: "2024-01-05T10:00:00Z",
  },
  {
    id: "3",
    email: "jane@example.com",
    name: "Jane Smith",
    role: "user",
    createdAt: "2024-01-10T15:00:00Z",
    updatedAt: "2024-01-10T15:00:00Z",
  },
  {
    id: "4",
    email: "guest@example.com",
    name: "Guest User",
    role: "guest",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z",
  },
];

let nextUserId = 5;

export function getUsers(): User[] {
  return [...users];
}

export function getUserById(id: string): User | undefined {
  return users.find((user) => user.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return users.find((user) => user.email === email);
}

export function createUser(
  input: Omit<User, "id" | "createdAt" | "updatedAt">,
): User {
  const now = new Date().toISOString();
  const newUser: User = {
    ...input,
    id: String(nextUserId++),
    createdAt: now,
    updatedAt: now,
  };
  users.push(newUser);
  return newUser;
}

export function updateUser(
  id: string,
  input: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>,
): User | undefined {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return undefined;

  const existingUser = users[index];
  if (!existingUser) return undefined;

  const updatedUser: User = {
    id: existingUser.id,
    email: input.email ?? existingUser.email,
    name: input.name ?? existingUser.name,
    role: input.role ?? existingUser.role,
    createdAt: existingUser.createdAt,
    updatedAt: new Date().toISOString(),
  };
  users[index] = updatedUser;
  return updatedUser;
}

export function deleteUser(id: string): boolean {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return false;

  users.splice(index, 1);
  return true;
}
