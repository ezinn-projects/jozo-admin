import { describe, expect, it } from "vitest";
import {
  getFnbRevenue,
  normalizeRevenueBreakdown,
  resolveBillRevenueBreakdown,
  resolveMenuItemRevenueCategory,
  shouldRequireRevenueCategoryReason,
  sumBillRevenueBreakdowns,
} from "./revenueBreakdown";

describe("revenueBreakdown", () => {
  it("chuẩn hóa byCategory thiếu field về 0", () => {
    expect(normalizeRevenueBreakdown({ SERVICE_ROOM: 1000 })).toEqual({
      SERVICE_ROOM: 1000,
      FNB_RETAIL: 0,
      FNB_PREPARED: 0,
      OTHER: 0,
    });
  });

  it("cộng F&B từ FNB_RETAIL + FNB_PREPARED", () => {
    expect(
      getFnbRevenue({
        SERVICE_ROOM: 10,
        FNB_RETAIL: 20,
        FNB_PREPARED: 30,
        OTHER: 5,
      }),
    ).toBe(50);
  });

  it("fallback bill cũ chưa có revenueBreakdown sang phòng / FNB_RETAIL", () => {
    expect(
      resolveBillRevenueBreakdown({
        roomTotal: 80000,
        fnbTotal: 20000,
      }),
    ).toEqual({
      SERVICE_ROOM: 80000,
      FNB_RETAIL: 20000,
      FNB_PREPARED: 0,
      OTHER: 0,
    });
  });

  it("cộng breakdown nhiều bill", () => {
    expect(
      sumBillRevenueBreakdowns([
        {
          revenueBreakdown: {
            SERVICE_ROOM: 100,
            FNB_RETAIL: 20,
            FNB_PREPARED: 10,
            OTHER: 5,
          },
        },
        { roomTotal: 50, fnbTotal: 15 },
      ]),
    ).toEqual({
      SERVICE_ROOM: 150,
      FNB_RETAIL: 35,
      FNB_PREPARED: 10,
      OTHER: 5,
    });
  });

  it("món chưa gắn category tạm tính FNB_RETAIL", () => {
    expect(resolveMenuItemRevenueCategory(undefined)).toBe("FNB_RETAIL");
    expect(resolveMenuItemRevenueCategory("SERVICE_ROOM")).toBe("FNB_RETAIL");
  });

  it("chỉ yêu cầu lý do khi đổi revenueCategory", () => {
    expect(
      shouldRequireRevenueCategoryReason("FNB_RETAIL", "FNB_PREPARED"),
    ).toBe(true);
    expect(shouldRequireRevenueCategoryReason("FNB_RETAIL", "FNB_RETAIL")).toBe(
      false,
    );
    expect(shouldRequireRevenueCategoryReason(undefined, "FNB_RETAIL")).toBe(
      false,
    );
    expect(shouldRequireRevenueCategoryReason(undefined, "FNB_PREPARED")).toBe(
      true,
    );
  });
});
