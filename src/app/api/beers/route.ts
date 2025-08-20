import { NextResponse } from "next/server";
import { exampleBeers } from "./examples";

export function GET() {
  return NextResponse.json(exampleBeers);
}
