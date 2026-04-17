import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyInvitations } from "../../services/activityInvitations.service";
import type { EmployeeInvitationListItem } from "../../types/activity-invitations";
import "./employee-activity-invitations.css";

function formatDate(v?: string) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return v;
  }
}

function formatStatus(s?: string) {
  if (!s) return "";
  return s.replaceAll("_", " ");
}

export default function EmployeeActivityArchivePage() {
  const [items, setItems] = useState<EmployeeInvitationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 320);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMyInvitations({
          view: "archive",
          q: debouncedSearch || undefined,
        });
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load your past activities.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  return (
    <div className="emp-inv-page">
      <div className="emp-inv-shell">
        <header className="emp-inv-header">
          <h1 className="emp-inv-title">Activity archive</h1>
          <p className="emp-inv-sub">
            Activities you <strong>accepted</strong> that are finished, cancelled, or past their end
            date. Open a row to see the same details as in invitations.
          </p>
        </header>

        <div className="emp-inv-toolbar" role="search">
          <label className="emp-inv-toolbar__search-label">
            <span className="emp-inv-visually-hidden">Search archive</span>
            <input
              type="search"
              className="emp-inv-toolbar__search"
              placeholder="Search by title, type, location, status…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>

        {error ? <div className="emp-inv-banner emp-inv-banner--error">{error}</div> : null}

        {loading ? (
          <div className="emp-inv-loading">Loading…</div>
        ) : items.length === 0 ? (
          <div className="emp-inv-empty">
            {debouncedSearch
              ? "No past activities match your search."
              : "No past participations yet. When you complete an activity, it will show up here."}
          </div>
        ) : (
          <ul className="emp-inv-card-list">
            {items.map((inv) => (
              <li key={inv._id}>
                <Link className="emp-inv-card" to={`/me/activity-invitations/${inv._id}`}>
                  <div className="emp-inv-card__main">
                    <h2 className="emp-inv-card__title">{inv.activityTitle || "Activity"}</h2>
                    <p className="emp-inv-card__meta">
                      {inv.activityType} · {inv.activityLocation || "—"}
                      {inv.activityStatus ? (
                        <>
                          {" "}
                          · <span style={{ fontWeight: 700 }}>{formatStatus(inv.activityStatus)}</span>
                        </>
                      ) : null}
                    </p>
                    <p className="emp-inv-card__dates">
                      {formatDate(inv.activityStartDate)} → {formatDate(inv.activityEndDate)}
                    </p>
                  </div>
                  <span className={`emp-inv-status emp-inv-status--${inv.status.toLowerCase()}`}>
                    {inv.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
