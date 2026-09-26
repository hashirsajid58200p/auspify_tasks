import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { generateTransactionsCsv } from "@/server/services/report";
import {
  reportFilterSchema,
  ReportFilterInput,
} from "@/validations/report";

export const GET = apiHandler<unknown, ReportFilterInput>(
  {
    auth: true,
    querySchema: reportFilterSchema,
  },
  async ({ user, query }) => {
    const csvContent = await generateTransactionsCsv(
      user!.userId,
      query.startDate,
      query.endDate
    );

    const nowStr = new Date().toISOString().slice(0, 10);
    const filename = `transactions-${nowStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
);
