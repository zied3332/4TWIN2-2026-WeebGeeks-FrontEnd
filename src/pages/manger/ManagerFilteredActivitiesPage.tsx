import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiCalendar, FiUsers } from "react-icons/fi";
import {
  listActivities,
  type ActivityRecord,
  type ListActivitiesQuery,
} from "../../services/activities.service";

const META: Record<
  NonNullable<ListActivitiesQuery["managerView"]>,
  { title: string; subtitle: string }
> = {
  running: {
    title: "Activities in progress",
    subtitle:
      "Launched by HR after final validation. Ongoing until the end date; open to follow staffing and the team view.",
  },
  past: {
    title: "Past activities",
    subtitle: "Completed or cancelled activities you were responsible for. Open to view details in read-only mode.",
  },
};

function formatLabel(v: string) {
  return v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ");
}

function ManagerFilteredActivitiesInner({
  mode,
}: {
  mode: NonNullable<ListActivitiesQuery["managerView"]>;
}) {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listActivities({ managerView: mode });
        if (!cancelled) setItems(data || []);
      } catch (e: unknown) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load activities.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
    return copy;
  }, [items]);

  const page = META[mode];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="page-header" style={{ marginBottom: "20px" }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            {page.title}
          </h1>
          <p className="page-subtitle" style={{ maxWidth: "720px", marginTop: "8px" }}>
            {page.subtitle}
          </p>
        </div>

        {error ? (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "14px",
              border: "1px solid #fecaca",
              background: "rgba(239,68,68,0.08)",
              color: "#b91c1c",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div style={{ color: "var(--muted)", padding: "40px 0" }}>Loading…</div>
        ) : sorted.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--muted)",
              border: "1px dashed var(--border)",
              borderRadius: "16px",
              background: "var(--surface-2)",
            }}
          >
            No activities in this list.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sorted.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => navigate(`/manager/activities/${a._id}/review`)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "16px",
                  alignItems: "center",
                  textAlign: "left",
                  padding: "18px 20px",
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  cursor: "pointer",
                  boxShadow: "var(--shadow)",
                  color: "var(--text)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "17px", marginBottom: "6px" }}>{a.title}</div>
                  <div style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 600 }}>
                    {formatLabel(a.type)} · {formatLabel(a.status)}
                    {a.workflowStatus ? ` · ${formatLabel(a.workflowStatus)}` : ""}
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "14px",
                      fontSize: "13px",
                      color: "var(--muted)",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <FiCalendar size={14} /> {a.startDate} → {a.endDate}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <FiUsers size={14} /> {a.availableSlots} seats
                    </span>
                  </div>
                </div>
                <FiArrowRight size={22} style={{ color: "var(--sidebar-link-active-pill)", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ManagerRunningActivitiesPage() {
  return <ManagerFilteredActivitiesInner mode="running" />;
}

export function ManagerPastActivitiesPage() {
  return <ManagerFilteredActivitiesInner mode="past" />;
}
