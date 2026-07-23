"use client";

import { useState } from "react";
import styles from "./DomainForm.module.css";

export function DomainForm() {
  const [domain, setDomain] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      // In a real app, the API URL would be configured via env vars
      const res = await fetch(`http://localhost:4000/api/domain/${encodeURIComponent(domain)}/snapshots`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to fetch");
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="e.g. google.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className={styles.input}
          disabled={loading}
        />
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Searching..." : "Watch"}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {data && (
        <div className={styles.results}>
          <p>Found <strong>{data.count}</strong> snapshots for {data.domain}.</p>
          <pre className={styles.json}>
            {JSON.stringify(data.snapshots.slice(0, 5), null, 2)}
          </pre>
          {data.count > 5 && <p>...and {data.count - 5} more.</p>}
        </div>
      )}
    </div>
  );
}
