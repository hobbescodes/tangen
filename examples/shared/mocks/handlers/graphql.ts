import { HttpResponse, graphql } from "msw";

import {
  createPet,
  deletePet,
  getPetById,
  getPets,
  getPetsByCategory,
  getPetsByStatus,
  updatePet,
} from "../data/pets";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../data/users";

import type { GraphQLHandler } from "msw";
import type { Pet, PetCategory, PetStatus } from "../data/pets";
import type { User, UserRole } from "../data/users";

type BoolExpComparison = {
  _eq?: unknown;
  _neq?: unknown;
  _in?: unknown[];
  _nin?: unknown[];
  _like?: string;
  _ilike?: string;
  _is_null?: boolean;
  _gt?: number | string;
  _gte?: number | string;
  _lt?: number | string;
  _lte?: number | string;
};

type BoolExp = {
  _and?: BoolExp[];
  _or?: BoolExp[];
  _not?: BoolExp;
  [field: string]: BoolExpComparison | BoolExp[] | BoolExp | undefined;
};

// Helper to apply Hasura-style boolean expressions
function applyPetBoolExp(items: Pet[], where: BoolExp | undefined): Pet[] {
  if (!where) return items;

  return items.filter((item) => {
    // Handle _and
    if (where._and && Array.isArray(where._and)) {
      return where._and.every((exp) => applyPetBoolExp([item], exp).length > 0);
    }

    // Handle _or
    if (where._or && Array.isArray(where._or)) {
      return where._or.some((exp) => applyPetBoolExp([item], exp).length > 0);
    }

    // Handle _not
    if (where._not) {
      return applyPetBoolExp([item], where._not).length === 0;
    }

    // Handle field comparisons
    for (const [field, comparison] of Object.entries(where)) {
      if (field.startsWith("_")) continue;
      if (
        !comparison ||
        typeof comparison !== "object" ||
        Array.isArray(comparison)
      )
        continue;

      const value = item[field as keyof Pet];
      const comp = comparison as BoolExpComparison;

      if (comp._eq !== undefined && value !== comp._eq) return false;
      if (comp._neq !== undefined && value === comp._neq) return false;
      if (comp._in !== undefined && !comp._in.includes(value)) return false;
      if (comp._nin?.includes(value)) return false;
      if (
        comp._like !== undefined &&
        typeof value === "string" &&
        !value.includes(comp._like)
      )
        return false;
      if (
        comp._ilike !== undefined &&
        typeof value === "string" &&
        !value.toLowerCase().includes(comp._ilike.toLowerCase())
      )
        return false;
      if (comp._is_null !== undefined) {
        const isNull = value === null || value === undefined;
        if (comp._is_null !== isNull) return false;
      }
    }

    return true;
  });
}

function applyUserBoolExp(items: User[], where: BoolExp | undefined): User[] {
  if (!where) return items;

  return items.filter((item) => {
    // Handle _and
    if (where._and && Array.isArray(where._and)) {
      return where._and.every(
        (exp) => applyUserBoolExp([item], exp).length > 0,
      );
    }

    // Handle _or
    if (where._or && Array.isArray(where._or)) {
      return where._or.some((exp) => applyUserBoolExp([item], exp).length > 0);
    }

    // Handle _not
    if (where._not) {
      return applyUserBoolExp([item], where._not).length === 0;
    }

    // Handle field comparisons
    for (const [field, comparison] of Object.entries(where)) {
      if (field.startsWith("_")) continue;
      if (
        !comparison ||
        typeof comparison !== "object" ||
        Array.isArray(comparison)
      )
        continue;

      const value = item[field as keyof User];
      const comp = comparison as BoolExpComparison;

      if (comp._eq !== undefined && value !== comp._eq) return false;
      if (comp._neq !== undefined && value === comp._neq) return false;
      if (comp._in !== undefined && !comp._in.includes(value)) return false;
      if (comp._nin?.includes(value)) return false;
      if (
        comp._like !== undefined &&
        typeof value === "string" &&
        !value.includes(comp._like)
      )
        return false;
      if (
        comp._ilike !== undefined &&
        typeof value === "string" &&
        !value.toLowerCase().includes(comp._ilike.toLowerCase())
      )
        return false;
      if (comp._is_null !== undefined) {
        const isNull = value === null || value === undefined;
        if (comp._is_null !== isNull) return false;
      }
    }

    return true;
  });
}

type GetPetByIdVariables = { id: string };
type GetPetsVariables = {
  status?: PetStatus;
  category?: PetCategory;
  limit?: number;
  offset?: number;
};
type ListPetsFilteredVariables = {
  where?: BoolExp;
  order_by?: Array<Record<string, string>>;
  limit?: number;
  offset?: number;
};
type GetUserVariables = { id: string };
type ListUsersVariables = {
  role?: UserRole;
  limit?: number;
  offset?: number;
};
type ListUsersFilteredVariables = {
  where?: BoolExp;
  order_by?: Array<Record<string, string>>;
  limit?: number;
  offset?: number;
};
type CreatePetVariables = {
  input: {
    name: string;
    category: PetCategory;
    status: PetStatus;
    tags: string[];
    photoUrl?: string;
  };
};
type UpdatePetVariables = {
  id: string;
  input: {
    name?: string;
    category?: PetCategory;
    status?: PetStatus;
    tags?: string[];
    photoUrl?: string;
  };
};
type DeletePetVariables = { id: string };
type CreateUserVariables = {
  input: {
    email: string;
    name: string;
    role: UserRole;
  };
};
type UpdateUserVariables = {
  id: string;
  input: {
    email?: string;
    name?: string;
    role?: UserRole;
  };
};
type DeleteUserVariables = { id: string };

// Helper function for GetPets query
const handleGetPets = ({ variables }: { variables: GetPetsVariables }) => {
  const { status, category, limit = 20, offset = 0 } = variables;

  let pets: Pet[];
  if (status) {
    pets = getPetsByStatus(status);
  } else if (category) {
    pets = getPetsByCategory(category);
  } else {
    pets = getPets();
  }

  const total = pets.length;
  const paginatedPets = pets.slice(offset, offset + limit);

  return HttpResponse.json({
    data: {
      pets: {
        data: paginatedPets,
        total,
      },
    },
  });
};

// Helper function for GetPetById query
const handleGetPetById = ({
  variables,
}: {
  variables: GetPetByIdVariables;
}) => {
  const { id } = variables;
  const pet = getPetById(id);
  return HttpResponse.json({ data: { pet } });
};

export const graphqlHandlers: GraphQLHandler[] = [
  // Pet Queries - matching tangrams generated operation names
  graphql.query<{ pets: { data: Pet[]; total: number } }, GetPetsVariables>(
    "GetPets",
    handleGetPets,
  ),

  graphql.query<{ pet: Pet | undefined }, GetPetByIdVariables>(
    "GetPetById",
    handleGetPetById,
  ),

  graphql.query<
    { pets_filtered: { data: Pet[]; total: number } },
    ListPetsFilteredVariables
  >("ListPetsFiltered", ({ variables }) => {
    const { where, limit = 20, offset = 0 } = variables;

    let pets = getPets();
    pets = applyPetBoolExp(pets, where);

    const total = pets.length;
    const paginatedPets = pets.slice(offset, offset + limit);

    return HttpResponse.json({
      data: {
        pets_filtered: {
          data: paginatedPets,
          total,
        },
      },
    });
  }),

  graphql.query<{ user: User | undefined }, GetUserVariables>(
    "GetUser",
    ({ variables }) => {
      const { id } = variables;
      const user = getUserById(id);
      return HttpResponse.json({ data: { user } });
    },
  ),

  graphql.query<{ users: { data: User[]; total: number } }, ListUsersVariables>(
    "ListUsers",
    ({ variables }) => {
      const { role, limit = 20, offset = 0 } = variables;

      let users: User[] = getUsers();
      if (role) {
        users = users.filter((user) => user.role === role);
      }

      const total = users.length;
      const paginatedUsers = users.slice(offset, offset + limit);

      return HttpResponse.json({
        data: {
          users: {
            data: paginatedUsers,
            total,
          },
        },
      });
    },
  ),

  graphql.query<
    { users_filtered: { data: User[]; total: number } },
    ListUsersFilteredVariables
  >("ListUsersFiltered", ({ variables }) => {
    const { where, limit = 20, offset = 0 } = variables;

    let users = getUsers();
    users = applyUserBoolExp(users, where);

    const total = users.length;
    const paginatedUsers = users.slice(offset, offset + limit);

    return HttpResponse.json({
      data: {
        users_filtered: {
          data: paginatedUsers,
          total,
        },
      },
    });
  }),

  // Mutations
  graphql.mutation<{ createPet: Pet }, CreatePetVariables>(
    "CreatePet",
    ({ variables }) => {
      const { input } = variables;
      const pet = createPet(input);
      return HttpResponse.json({ data: { createPet: pet } });
    },
  ),

  graphql.mutation<{ updatePet: Pet | undefined }, UpdatePetVariables>(
    "UpdatePet",
    ({ variables }) => {
      const { id, input } = variables;
      const pet = updatePet(id, input);
      return HttpResponse.json({ data: { updatePet: pet } });
    },
  ),

  graphql.mutation<{ deletePet: boolean }, DeletePetVariables>(
    "DeletePet",
    ({ variables }) => {
      const { id } = variables;
      const deleted = deletePet(id);
      return HttpResponse.json({ data: { deletePet: deleted } });
    },
  ),

  graphql.mutation<{ createUser: User }, CreateUserVariables>(
    "CreateUser",
    ({ variables }) => {
      const { input } = variables;
      const user = createUser(input);
      return HttpResponse.json({ data: { createUser: user } });
    },
  ),

  graphql.mutation<{ updateUser: User | undefined }, UpdateUserVariables>(
    "UpdateUser",
    ({ variables }) => {
      const { id, input } = variables;
      const user = updateUser(id, input);
      return HttpResponse.json({ data: { updateUser: user } });
    },
  ),

  graphql.mutation<{ deleteUser: boolean }, DeleteUserVariables>(
    "DeleteUser",
    ({ variables }) => {
      const { id } = variables;
      const deleted = deleteUser(id);
      return HttpResponse.json({ data: { deleteUser: deleted } });
    },
  ),
];
