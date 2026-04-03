/** Vietnam (Asia/Ho_Chi_Minh) has no DST — always UTC+7. */

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Interprets `dateYmd` (YYYY-MM-DD) + `timeHm` (HH:mm) as wall clock in GMT+7,
 * returns ISO-8601 instant in UTC (e.g. for booking API / Swagger parity).
 */
export function vietnamWallToUtcIso(dateYmd: string, timeHm: string): string {
  const [y, mo, da] = dateYmd.split("-").map(Number);
  const [hh, mm = 0] = timeHm.split(":").map(Number);
  const utcMs = Date.UTC(y, mo - 1, da, hh, mm, 0, 0) - VN_OFFSET_MS;
  return new Date(utcMs).toISOString();
}
