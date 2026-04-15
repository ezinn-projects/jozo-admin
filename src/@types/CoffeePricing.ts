export const COFFEE_BOARD_GAME_PRICING_ID = "board-game-pricing";

export interface ICoffeePricingConfig {
  _id?: string;
  pricePerPerson: number;
  currency: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface IUpsertCoffeePricingRequestBody {
  _id: string;
  pricePerPerson: number;
  currency: string;
}
