// Load test k6: menyimulasikan ribuan pembeli menyerbu drop tiket bersamaan.
//
// Jalankan (k6 adalah tool terpisah, bukan paket npm):
//   k6 run -e BASE_URL=https://APP-ANDA.vercel.app -e STOCK=100 loadtest/k6-flashsale.js
//
// Bukti elasticity + anti-overselling (dicetak otomatis di ringkasan akhir):
//   - tickets_confirmed berhenti tepat di jumlah stok (mis. 100).
//   - sisa request menghasilkan tickets_sold_out.
//   - VONIS "LULUS" bila confirmed <= STOCK (tidak ada overselling).
//   - cek tabel products di Supabase: remaining_stock akhir = 0 (tidak minus).
import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const confirmed = new Counter("tickets_confirmed");
const soldOut = new Counter("tickets_sold_out");
const duplicate = new Counter("tickets_duplicate");
const errors = new Counter("request_errors");

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const STOCK = Number(__ENV.STOCK || 100);

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
    // Pagar pengaman utama: tiket confirmed tidak boleh melebihi stok.
    tickets_confirmed: [`count<=${STOCK}`],
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

  if (res.status !== 200) {
    errors.add(1);
    return;
  }

  try {
    const body = res.json();
    if (body && body.already_purchased) duplicate.add(1);
    else if (body && body.status === "confirmed") confirmed.add(1);
    else if (body && body.status === "sold_out") soldOut.add(1);
    else errors.add(1);
  } catch (_e) {
    errors.add(1);
  }
}

function metricCount(data, name) {
  const m = data.metrics[name];
  return m && m.values ? m.values.count || 0 : 0;
}

// Ringkasan akhir yang mudah dibaca + bukti tersimpan ke file untuk video.
export function handleSummary(data) {
  const confirmedCount = metricCount(data, "tickets_confirmed");
  const soldOutCount = metricCount(data, "tickets_sold_out");
  const dupCount = metricCount(data, "tickets_duplicate");
  const errorCount = metricCount(data, "request_errors");
  const totalReqs = metricCount(data, "http_reqs");

  const durMetric = data.metrics.http_req_duration;
  const p95 = durMetric && durMetric.values ? durMetric.values["p(95)"] : 0;
  const failMetric = data.metrics.http_req_failed;
  const failRate = failMetric && failMetric.values ? failMetric.values.rate : 0;

  const oversold = confirmedCount > STOCK;
  const verdict = oversold
    ? "GAGAL: TERJADI OVERSELLING"
    : "LULUS: TIDAK ADA OVERSELLING";

  const line = "=".repeat(52);
  const fmt = (n) => Number(n || 0).toFixed(0);
  const report = [
    "",
    line,
    "  LONJAK - HASIL LOAD TEST WAR TIKET",
    line,
    `  Kapasitas stok        : ${STOCK}`,
    `  Total request         : ${fmt(totalReqs)}`,
    `  Tiket confirmed       : ${fmt(confirmedCount)}`,
    `  Sold out (ditolak)    : ${fmt(soldOutCount)}`,
    `  Duplikat (idempoten)  : ${fmt(dupCount)}`,
    `  Error                 : ${fmt(errorCount)}`,
    `  Gagal HTTP (rate)     : ${(failRate * 100).toFixed(2)}%`,
    `  Latency p95           : ${Number(p95 || 0).toFixed(0)} ms`,
    line,
    `  VONIS: ${verdict}`,
    `  (confirmed ${fmt(confirmedCount)} ${oversold ? ">" : "<="} stok ${STOCK})`,
    line,
    "",
  ].join("\n");

  return {
    stdout: report,
    "loadtest/summary.json": JSON.stringify(
      {
        stock: STOCK,
        totalRequests: totalReqs,
        confirmed: confirmedCount,
        soldOut: soldOutCount,
        duplicate: dupCount,
        errors: errorCount,
        httpFailRate: failRate,
        p95Ms: p95,
        oversold,
        verdict,
      },
      null,
      2
    ),
  };
}
