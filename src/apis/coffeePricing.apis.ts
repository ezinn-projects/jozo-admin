import {
  ICoffeePricingConfig,
  IUpsertCoffeePricingRequestBody,
} from "@/@types/CoffeePricing";
import http from "@/utils/http";

const COFFEE_PRICING_CONTROLLER = "/coffee-pricing";

const coffeePricingApis = {
  getCoffeePricing: () =>
    http.get<HTTPResponse<ICoffeePricingConfig>>(COFFEE_PRICING_CONTROLLER),
  upsertCoffeePricing: (payload: IUpsertCoffeePricingRequestBody) =>
    http.put<HTTPResponse<ICoffeePricingConfig>>(
      COFFEE_PRICING_CONTROLLER,
      payload
    ),
};

export default coffeePricingApis;
