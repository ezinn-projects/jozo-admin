import type {
  ICompactCoffeeSessionOrder,
  ICoffeeOrderLegacySocketPayload,
  ICoffeeOrderSocketPayload,
  ICoffeeSessionOrderDetail,
  IOrderBatchStatusChangedSocketPayload,
  IOrderCreatedSocketPayload,
  ISubmitCartCoffeeSessionOrderResult,
} from "@/@types/CoffeeSessionOrder";
import { describe, expect, it } from "vitest";
import {
  applyBatchStatusChangedToAggregated,
  applyBatchStatusChangedToDetail,
  isOrderCreatedSocketPayload,
  mergeAggregatedIntoDetail,
  parseSubmitCartResult,
  pendingBatches,
} from "./coffeeSessionOrderBatch";

const baseDetail = (): ICoffeeSessionOrderDetail => ({
  coffeeSessionId: "sess-1",
  order: { drinks: { a: 1 }, snacks: {} },
  items: { drinks: [], snacks: [] },
  lineItems: [],
  batches: [
    {
      batchId: "b1",
      status: "pending",
      submittedAt: "2026-01-01T10:00:00.000Z",
      order: { lines: [] },
      lineItems: [
        {
          lineId: "l1",
          itemId: "i1",
          name: "Trà",
          price: 10000,
          quantity: 1,
          category: "drink",
        },
      ],
    },
  ],
});

describe("parseSubmitCartResult", () => {
  it("chấp nhận result hợp lệ", () => {
    const body: ISubmitCartCoffeeSessionOrderResult = {
      aggregatedOrder: null,
      createdBatch: {
        batchId: "batch-new",
        status: "pending",
        submittedAt: "2026-01-02T12:00:00.000Z",
        order: { lines: [] },
        lineItems: [],
      },
    };
    expect(parseSubmitCartResult(body)).toEqual(body);
  });

  it("throw khi thiếu createdBatch", () => {
    const broken = {
      aggregatedOrder: null,
      createdBatch: undefined,
    } as unknown as ISubmitCartCoffeeSessionOrderResult;
    expect(() => parseSubmitCartResult(broken)).toThrow(/createdBatch/);
  });
});

describe("isOrderCreatedSocketPayload", () => {
  it("nhận diện payload batch mới", () => {
    const p: IOrderCreatedSocketPayload = {
      tableId: "t1",
      tableCode: "A1",
      coffeeSessionId: "s1",
      aggregatedOrder: null,
      createdBatch: {
        batchId: "b1",
        status: "pending",
        submittedAt: "2026-01-01T00:00:00.000Z",
        order: { lines: [] },
        lineItems: [],
      },
      submittedLineItems: [],
      createdAt: 1,
    };
    expect(isOrderCreatedSocketPayload(p)).toBe(true);
  });

  it("từ chối payload legacy (không có createdBatch)", () => {
    const p: ICoffeeOrderLegacySocketPayload = {
      tableId: "t1",
      tableCode: "A1",
      coffeeSessionId: "s1",
      order: {
        _id: "o1",
        coffeeSessionId: "s1",
        order: { drinks: {}, snacks: {} },
      },
      createdAt: 1,
    };
    const union = p as ICoffeeOrderSocketPayload;
    expect(isOrderCreatedSocketPayload(union)).toBe(false);
  });
});

describe("mergeAggregatedIntoDetail + applyBatchStatusChanged", () => {
  it("cập nhật batches sau hai sự kiện socket (created rồi batch_status)", () => {
    let detail = baseDetail();
    const agg: ICompactCoffeeSessionOrder = {
      coffeeSessionId: "sess-1",
      order: {
        lines: [
          {
            lineId: "x",
            itemId: "i1",
            category: "drink",
            quantity: 2,
          },
        ],
      },
      lineItems: [],
      batches: [
        {
          batchId: "b1",
          status: "pending",
          submittedAt: "2026-01-01T10:00:00.000Z",
          order: { lines: [] },
          lineItems: [],
        },
        {
          batchId: "b2",
          status: "pending",
          submittedAt: "2026-01-01T10:15:00.000Z",
          order: { lines: [] },
          lineItems: [],
        },
      ],
      updatedAt: "2026-01-01T10:15:00.000Z",
    };

    detail = mergeAggregatedIntoDetail(detail, agg);
    expect(detail.batches?.map((b) => b.batchId)).toEqual(["b1", "b2"]);
    expect(pendingBatches(detail.batches).length).toBe(2);

    const statusEvt: IOrderBatchStatusChangedSocketPayload = {
      tableId: "t",
      tableCode: "A1",
      coffeeSessionId: "sess-1",
      batchId: "b1",
      status: "served",
      servedAt: "2026-01-01T10:30:00.000Z",
      servedBy: "staff-1",
      updatedAt: 99,
    };

    detail = applyBatchStatusChangedToDetail(detail, statusEvt);
    const b1 = detail.batches?.find((b) => b.batchId === "b1");
    expect(b1?.status).toBe("served");
    expect(b1?.servedBy).toBe("staff-1");
    expect(pendingBatches(detail.batches).map((b) => b.batchId)).toEqual([
      "b2",
    ]);
  });

  it("applyBatchStatusChangedToAggregated khi không có batches thì giữ nguyên", () => {
    const agg: ICompactCoffeeSessionOrder = {
      coffeeSessionId: "s",
      order: { lines: [] },
      lineItems: [],
      updatedAt: "x",
    };
    const r = applyBatchStatusChangedToAggregated(agg, {
      tableId: "",
      tableCode: "",
      coffeeSessionId: "s",
      batchId: "nope",
      status: "served",
      updatedAt: 1,
    });
    expect(r?.batches).toBeUndefined();
  });
});
