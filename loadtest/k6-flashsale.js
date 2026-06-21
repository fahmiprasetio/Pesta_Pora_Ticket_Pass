// Load test k6: menyimulasikan ribuan pembeli menyerbu drop tiket bersamaan.
//
// Jalankan (k6 adalah tool terpisah, bukan paket npm):
//   k6 run -e BASE_URL=https://APP-ANDA.vercel.app loadtest/k6-flashsale.js
//
// Bukti elasticity + anti-overselling:
//   - metrik tickets_confirmed harus berhenti tepat di jumlah stok (mis. 100).
//   - sisa request menghasilkan tickets_sold_out.
//   - cek tabel products di Supabase: remaining_stock akhir = 0 (tidak minus).
import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const confirmed = new Counter("tickets_confirmed");
const soldOut = new Counter("tickets_sold_out");

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  scenarios: {
    flash_drop: {
      executor: "ramping-arrival-rate",
      startRate: 50,
      timeUnit: "1s",
      preAllocatedVUs: 200,
      maxVUs: 1500,
      stages: [
        { target: 400, duration: "10s" },
        { target: 1200, duration: "20s" },
        { target: 0, duration: "5s" },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  // Token unik per iterasi supaya tiap request dihitung sebagai pembeli berbeda.
  const token = `${__VU}-${__ITER}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;

  const res = http.post(
    `${BASE_URL}/api/purchase`,
    JSON.stringify({ buyerToken: token }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(res, { "status 200": (r) => r.status === 200 });

  try {
    const body = res.json();
    if (body && body.status === "confirmed") confirmed.add(1);
    else if (body && body.status === "sold_out") soldOut.add(1);
  } catch (_e) {
    // abaikan error parsing
  }
}
