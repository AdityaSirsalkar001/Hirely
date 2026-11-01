import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    opening: { findMany: vi.fn(), count: vi.fn() },
    hiringProfile: { findFirst: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../../../src/config/prisma/prisma.js", () => ({ default: prisma }));

import { listVendorOpenings } from "../../../../src/controllers/hiring/hiringManagementController.js";
import { shortlistProfile } from "../../../../src/controllers/hiring/hiringManagementController.js";

function response() {
  const res: any = { status: vi.fn(), json: vi.fn(), send: vi.fn() };
  res.status.mockImplementation(() => res);
  return res;
}

describe("hiring authorization and tenant isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a vendor request without tenant-bound identity", async () => {
    const res = response();
    await listVendorOpenings({ query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.opening.findMany).not.toHaveBeenCalled();
  });

  it("scopes vendor opening lists to the authenticated tenant", async () => {
    prisma.opening.findMany.mockResolvedValue([]);
    prisma.opening.count.mockResolvedValue(0);
    prisma.$transaction.mockResolvedValue([[], 0]);
    const res = response();

    await listVendorOpenings({
      user: { id: "vendor-1", tenant: { tenantId: "tenant-a" } },
      query: { page: "1", limit: "20" },
    } as any, res);

    expect(prisma.opening.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: "tenant-a", status: "OPEN" },
    }));
  });

  it("does not shortlist a profile outside the manager's tenant and openings", async () => {
    const tx = { hiringProfile: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() } };
    prisma.$transaction.mockImplementation(async (callback: any) => callback(tx));
    const res = response();

    await shortlistProfile({
      params: { id: "42" },
      user: { id: "manager-a", tenant: { tenantId: "tenant-a" } },
    } as any, res);

    expect(tx.hiringProfile.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: 42,
        isDeleted: false,
        opening: { is: { hiringManagerId: "manager-a", tenantId: "tenant-a" } },
      },
    }));
    expect(tx.hiringProfile.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
