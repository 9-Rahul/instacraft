import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(authHeader.split("Bearer ")[1]);
    } catch {
      return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }

    const customerRows = await db.query("SELECT id FROM customers WHERE firebase_uid = ?", [decodedToken.uid]);
    const customer = customerRows[0];

    if (!customer) {
      return NextResponse.json({ success: true, addresses: [] }, { status: 200 });
    }

    const addrRows = await db.query("SELECT * FROM customer_addresses WHERE customer_id = ?", [customer.id]);

    const addresses = addrRows.map((addr) => ({
      ...addr,
      _id: addr.id.toString(),
      isDefault: addr.is_default
    }));

    return NextResponse.json({ success: true, addresses }, { status: 200 });
  } catch (error) {
    console.error("Addresses GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
