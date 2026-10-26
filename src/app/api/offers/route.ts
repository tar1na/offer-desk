import { connection } from "next/server";
import { listOffers } from "@/lib/db";

export async function GET() {
  await connection();
  return Response.json({ offers: listOffers() });
}
