import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess } from "./types";

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status });
}

export function fail(message: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error: { message } }, { status });
}
