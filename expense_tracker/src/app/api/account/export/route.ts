import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { exportUserData } from "@/server/services/account";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    const data = await exportUserData(user!.userId);
    const jsonStr = JSON.stringify(data, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="expense-tracker-export-${dateStr}.json"`,
      },
    });
  }
);
