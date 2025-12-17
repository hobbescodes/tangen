export type PetStatus = "available" | "pending" | "sold";

export type PetCategory = "dog" | "cat" | "bird" | "fish" | "reptile";

export interface Pet {
  id: string;
  name: string;
  category: PetCategory;
  status: PetStatus;
  tags: string[];
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const pets: Pet[] = [
  {
    id: "1",
    name: "Buddy",
    category: "dog",
    status: "available",
    tags: ["friendly", "trained"],
    photoUrl: "https://placecats.com/300/200",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Whiskers",
    category: "cat",
    status: "available",
    tags: ["playful", "indoor"],
    photoUrl: "https://placecats.com/300/201",
    createdAt: "2024-01-16T11:00:00Z",
    updatedAt: "2024-01-16T11:00:00Z",
  },
  {
    id: "3",
    name: "Tweety",
    category: "bird",
    status: "pending",
    tags: ["singer", "colorful"],
    createdAt: "2024-01-17T12:00:00Z",
    updatedAt: "2024-01-17T12:00:00Z",
  },
  {
    id: "4",
    name: "Goldie",
    category: "fish",
    status: "available",
    tags: ["low-maintenance"],
    createdAt: "2024-01-18T13:00:00Z",
    updatedAt: "2024-01-18T13:00:00Z",
  },
  {
    id: "5",
    name: "Rex",
    category: "dog",
    status: "sold",
    tags: ["guard-dog", "trained"],
    photoUrl: "https://placecats.com/300/202",
    createdAt: "2024-01-19T14:00:00Z",
    updatedAt: "2024-02-01T09:00:00Z",
  },
  {
    id: "6",
    name: "Shadow",
    category: "cat",
    status: "available",
    tags: ["independent", "quiet"],
    photoUrl: "https://placecats.com/300/203",
    createdAt: "2024-01-20T15:00:00Z",
    updatedAt: "2024-01-20T15:00:00Z",
  },
  {
    id: "7",
    name: "Scales",
    category: "reptile",
    status: "available",
    tags: ["exotic", "beginner-friendly"],
    createdAt: "2024-01-21T16:00:00Z",
    updatedAt: "2024-01-21T16:00:00Z",
  },
  {
    id: "8",
    name: "Luna",
    category: "dog",
    status: "pending",
    tags: ["puppy", "playful"],
    photoUrl: "https://placecats.com/300/204",
    createdAt: "2024-01-22T17:00:00Z",
    updatedAt: "2024-02-05T10:00:00Z",
  },
];

let nextPetId = 9;

export function getPets(): Pet[] {
  return [...pets];
}

export function getPetById(id: string): Pet | undefined {
  return pets.find((pet) => pet.id === id);
}

export function getPetsByStatus(status: PetStatus): Pet[] {
  return pets.filter((pet) => pet.status === status);
}

export function getPetsByCategory(category: PetCategory): Pet[] {
  return pets.filter((pet) => pet.category === category);
}

export function createPet(
  input: Omit<Pet, "id" | "createdAt" | "updatedAt">,
): Pet {
  const now = new Date().toISOString();
  const newPet: Pet = {
    ...input,
    id: String(nextPetId++),
    createdAt: now,
    updatedAt: now,
  };
  pets.push(newPet);
  return newPet;
}

export function updatePet(
  id: string,
  input: Partial<Omit<Pet, "id" | "createdAt" | "updatedAt">>,
): Pet | undefined {
  const index = pets.findIndex((pet) => pet.id === id);
  if (index === -1) return undefined;

  const existingPet = pets[index];
  if (!existingPet) return undefined;

  const updatedPet: Pet = {
    id: existingPet.id,
    name: input.name ?? existingPet.name,
    category: input.category ?? existingPet.category,
    status: input.status ?? existingPet.status,
    tags: input.tags ?? existingPet.tags,
    photoUrl: input.photoUrl ?? existingPet.photoUrl,
    createdAt: existingPet.createdAt,
    updatedAt: new Date().toISOString(),
  };
  pets[index] = updatedPet;
  return updatedPet;
}

export function deletePet(id: string): boolean {
  const index = pets.findIndex((pet) => pet.id === id);
  if (index === -1) return false;

  pets.splice(index, 1);
  return true;
}
