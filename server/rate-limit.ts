import type { Sql } from './db/connection'
export function limiter(sql: Sql) {
  return { async consume(key: string, rule: { window: number; max: number }) {
    const now = Date.now(), windowMs = rule.window * 1000
    const row = (await sql.query(`INSERT INTO api_rate_limits(key,window_start,count) VALUES($1,$2,1)
      ON CONFLICT(key) DO UPDATE SET
      count=CASE WHEN api_rate_limits.window_start <= $2-$3 THEN 1 ELSE api_rate_limits.count+1 END,
      window_start=CASE WHEN api_rate_limits.window_start <= $2-$3 THEN $2 ELSE api_rate_limits.window_start END
      RETURNING count,window_start`,[key,now,windowMs])).rows[0]
    return { allowed:Number(row.count)<=rule.max,retryAfter:Math.max(1,Math.ceil((Number(row.window_start)+windowMs-now)/1000)) }
  } }
}

