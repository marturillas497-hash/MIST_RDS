import { getPool } from "./postgres";

export async function matchAbstracts({ embedding, matchThreshold, matchCount }) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const vectorStr = `[${embedding.join(",")}]`;
    const result = await client.query(
      `SELECT id, title, abstract_text, authors, year, department_id, accession_id,
        1 - (embedding <=> $1::vector) AS similarity
       FROM abstracts
       WHERE embedding IS NOT NULL
         AND 1 - (embedding <=> $1::vector) > $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [vectorStr, matchThreshold, matchCount]
    );
    return result.rows;
  } finally {
    client.release();
  }
}