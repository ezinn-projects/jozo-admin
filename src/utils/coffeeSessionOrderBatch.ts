import type {
  ICompactCoffeeSessionOrder,
  ICompactCoffeeSessionOrderBatch,
  ICoffeeSessionOrder,
  ICoffeeSessionOrderDetail,
  ICoffeeSessionOrderLine,
  ICoffeeSessionOrderLineItem,
  ICoffeeOrderSocketPayload,
  IOrderBatchStatusChangedSocketPayload,
  IOrderCreatedSocketPayload,
  ISubmitCartCoffeeSessionOrderResult,
} from "@/@types/CoffeeSessionOrder";

export function isOrderCreatedSocketPayload(
  p: ICoffeeOrderSocketPayload,
): p is IOrderCreatedSocketPayload {
  return (
    typeof p === "object" &&
    p !== null &&
    "createdBatch" in p &&
    (p as IOrderCreatedSocketPayload).createdBatch != null &&
    typeof (p as IOrderCreatedSocketPayload).createdBatch.batchId === "string"
  );
}

export function normalizeBatches(
  aggregated:
    | Pick<ICompactCoffeeSessionOrder, "batches">
    | Pick<ICoffeeSessionOrderDetail, "batches">
    | null
    | undefined,
): ICompactCoffeeSessionOrderBatch[] {
  return aggregated?.batches ?? [];
}

export function linesToDrinksSnacks(
  lines: ICoffeeSessionOrderLine[] | undefined,
): Pick<ICoffeeSessionOrder, "drinks" | "snacks"> {
  if (!lines?.length) {
    return { drinks: {}, snacks: {} };
  }
  return lines.reduce(
    (acc, line) => {
      const category = String(line.category || "").toLowerCase();
      const targetKey =
        category === "drink" || category === "drinks" ? "drinks" : "snacks";
      const itemId = String(line.itemId || "");
      const quantity = Number(line.quantity) || 0;
      if (!itemId || quantity <= 0) {
        return acc;
      }
      acc[targetKey][itemId] = (acc[targetKey][itemId] || 0) + quantity;
      return acc;
    },
    {
      drinks: {} as Record<string, number>,
      snacks: {} as Record<string, number>,
    },
  );
}

export function mergeAggregatedIntoDetail(
  prev: ICoffeeSessionOrderDetail,
  aggregated: ICompactCoffeeSessionOrder | null,
): ICoffeeSessionOrderDetail {
  if (!aggregated) {
    return prev;
  }

  const hasLines =
    Array.isArray(aggregated.order.lines) && aggregated.order.lines.length > 0;
  const { drinks, snacks } = hasLines
    ? linesToDrinksSnacks(aggregated.order.lines)
    : { drinks: prev.order.drinks, snacks: prev.order.snacks };

  return {
    ...prev,
    order: {
      ...prev.order,
      drinks,
      snacks,
      lines: hasLines ? aggregated.order.lines : prev.order.lines,
      variants: prev.order.variants,
    },
    lineItems: aggregated.lineItems ?? prev.lineItems,
    batches: aggregated.batches ?? prev.batches ?? [],
    orderTotals: aggregated.orderTotals ?? prev.orderTotals,
    updatedAt: aggregated.updatedAt ?? prev.updatedAt,
  };
}

export function applyBatchStatusChangedToDetail(
  detail: ICoffeeSessionOrderDetail,
  payload: IOrderBatchStatusChangedSocketPayload,
): ICoffeeSessionOrderDetail {
  const batches = detail.batches ?? [];
  if (batches.length === 0) {
    return detail;
  }
  const nextBatches = batches.map((b) =>
    b.batchId === payload.batchId
      ? {
          ...b,
          status: payload.status,
          servedAt:
            payload.servedAt != null ? String(payload.servedAt) : b.servedAt,
          servedBy: payload.servedBy ?? b.servedBy,
        }
      : b,
  );
  return { ...detail, batches: nextBatches };
}

export function applyBatchStatusChangedToAggregated(
  aggregated: ICompactCoffeeSessionOrder | null,
  payload: IOrderBatchStatusChangedSocketPayload,
): ICompactCoffeeSessionOrder | null {
  if (!aggregated) {
    return null;
  }
  const batches = aggregated.batches ?? [];
  if (batches.length === 0) {
    return aggregated;
  }
  const nextBatches = batches.map((b) =>
    b.batchId === payload.batchId
      ? {
          ...b,
          status: payload.status,
          servedAt:
            payload.servedAt != null ? String(payload.servedAt) : b.servedAt,
          servedBy: payload.servedBy ?? b.servedBy,
        }
      : b,
  );
  return { ...aggregated, batches: nextBatches };
}

export function summarizeLineItemsQuick(
  items: ICoffeeSessionOrderLineItem[] | undefined,
): string {
  if (!items?.length) {
    return "Đơn hàng mới";
  }
  let drinkQty = 0;
  let snackQty = 0;
  for (const it of items) {
    const c = String(it.category || "").toLowerCase();
    const q = Number(it.quantity) || 0;
    if (c === "drink" || c === "drinks") {
      drinkQty += q;
    } else {
      snackQty += q;
    }
  }
  const parts: string[] = [];
  if (drinkQty > 0) {
    parts.push(drinkQty === 1 ? "1 đồ uống" : `${drinkQty} đồ uống`);
  }
  if (snackQty > 0) {
    parts.push(snackQty === 1 ? "1 món ăn vặt" : `${snackQty} món ăn vặt`);
  }
  return parts.length > 0 ? parts.join(", ") : "Đơn hàng mới";
}

/** Kiểm tra shape submit-cart (unit test / runtime an toàn tối thiểu) */
export function parseSubmitCartResult(
  result: ISubmitCartCoffeeSessionOrderResult,
): ISubmitCartCoffeeSessionOrderResult {
  if (result.createdBatch == null || typeof result.createdBatch !== "object") {
    throw new Error("submit-cart: missing createdBatch");
  }
  if (typeof result.createdBatch.batchId !== "string") {
    throw new Error("submit-cart: createdBatch.batchId invalid");
  }
  return result;
}

export function pendingBatches(
  batches: ICompactCoffeeSessionOrderBatch[] | undefined,
): ICompactCoffeeSessionOrderBatch[] {
  return (batches ?? []).filter((b) => b.status === "pending");
}
