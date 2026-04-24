export interface GameType {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  totalGames?: number;
}

export interface Game {
  _id: string;
  typeId: string;
  name: string;
  slug: string;
  shortDescription?: string;
  guideContent: string;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  gameTypeLabel: {
    slug: string;
    name: string;
    description?: string;
  } | null;
}

export interface ListGamesQuery {
  typeId?: string;
  isActive?: boolean;
  keyword?: string;
}

export interface ListGameTypesQuery {
  isActive?: boolean;
  keyword?: string;
}

export interface CreateGameTypeFormDataPayload {
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  image?: File;
}

export interface UpdateGameTypeFormDataPayload {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  image?: File;
}

export interface CreateGameFormDataPayload {
  typeId: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  guideContent: string;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number;
  isActive?: boolean;
  images?: File[];
}

export interface UpdateGameFormDataPayload {
  typeId?: string;
  name?: string;
  slug?: string;
  shortDescription?: string;
  guideContent?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playTimeMinutes?: number;
  isActive?: boolean;
  images?: File[];
}
