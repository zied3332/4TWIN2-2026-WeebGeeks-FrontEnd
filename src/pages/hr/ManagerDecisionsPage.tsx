import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getActivityById, type ActivityRecord } from "../../services/activities.service";
import { getActivityInvitations } from "../../services/activityInvitations.service";
import type { ActivityInvitationItem } from "../../types/activity-invitations";
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiClock, FiUsers } from "react-icons/fi";
import "./ManagerDecisionsPage.css";

export default function ManagerDecisionsPage() {
  const { activityId = "" } = useParams();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [invitations, setInvitations] = useState<ActivityInvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!activityId) return;
      setLoading(true);
      setError("");
      try {
        const [activityData, invitationsData] = await Promise.all([
          getActivityById(activityId),
          getActivityInvitations(activityId),
        ]);
        setActivity(activityData);
        setInvitations(invitationsData);
      } catch (e: any) {
        console.error("Failed to load data:", e);
        setError(e?.message || "Failed to load manager decisions.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activityId]);

  const acceptedCandidates = invitations.filter(
    (inv) => inv.status === "ACCEPTED"
  );
  const rejectedCandidates = invitations.filter(
    (inv) => inv.status === "DECLINED"
  );
  const pendingCandidates = invitations.filter(
    (inv) => inv.status === "INVITED"
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACCEPTED":
      case "APPROVED":
        return <FiCheckCircle style={{ color: "#166534" }} />;
      case "DECLINED":
      case "REJECTED":
        return <FiXCircle style={{ color: "#b91c1c" }} />;
      default:
        return <FiClock style={{ color: "#d97706" }} />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "ACCEPTED":
      case "APPROVED":
        return "status-accepted";
      case "DECLINED":
      case "REJECTED":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  if (loading) {
    return (
      <div className="manager-decisions-page">
        <div className="decisions-shell">
          <div style={{ textAlign: "center", padding: 40 }}>
            <p>Loading manager decisions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="manager-decisions-page">
        <div className="decisions-shell">
          <div style={{ textAlign: "center", padding: 40, color: "#b91c1c" }}>
            <p>{error || "Activity not found"}</p>
            <button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
              <FiArrowLeft /> Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-decisions-page">
      <div className="decisions-shell">
        <div className="decisions-header">
          <button
            className="back-btn"
            onClick={() => navigate(`/hr/activities/${activityId}/staffing`)}
          >
            <FiArrowLeft /> Back to Staffing
          </button>
          <div>
            <span className="decisions-kicker">Manager Decisions</span>
            <h1>{activity.title}</h1>
            <p>View the manager's approval decisions for candidate selections.</p>
          </div>
        </div>

        {error ? <div className="decisions-error">{error}</div> : null}

        <div className="decisions-stats-grid">
          <div className="decisions-stat-card accepted">
            <FiCheckCircle size={24} />
            <div>
              <span>Accepted</span>
              <strong>{acceptedCandidates.length}</strong>
            </div>
          </div>
          <div className="decisions-stat-card rejected">
            <FiXCircle size={24} />
            <div>
              <span>Rejected</span>
              <strong>{rejectedCandidates.length}</strong>
            </div>
          </div>
          <div className="decisions-stat-card pending">
            <FiClock size={24} />
            <div>
              <span>Pending Review</span>
              <strong>{pendingCandidates.length}</strong>
            </div>
          </div>
          <div className="decisions-stat-card total">
            <FiUsers size={24} />
            <div>
              <span>Total Candidates</span>
              <strong>{invitations.length}</strong>
            </div>
          </div>
        </div>

        {acceptedCandidates.length > 0 && (
          <section className="decisions-section">
            <div className="section-header accepted">
              <FiCheckCircle />
              <h2>Accepted Candidates ({acceptedCandidates.length})</h2>
            </div>
            <div className="candidates-list">
              {acceptedCandidates.map((invitation) => (
                <div key={invitation._id || invitation.id} className="candidate-card accepted">
                  <div className="candidate-info">
                    <div className="candidate-name">
                      {getStatusIcon("ACCEPTED")}
                      <h3>Employee ID: {invitation.employeeId}</h3>
                      <span className={`status-badge ${getStatusClass("ACCEPTED")}`}>
                        ACCEPTED
                      </span>
                    </div>
                    {invitation.hrNote && (
                      <p className="manager-note">
                        <strong>Note:</strong> {invitation.hrNote}
                      </p>
                    )}
                    <p className="invited-date">
                      Invited: {invitation.invitedAt
                        ? new Date(invitation.invitedAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {rejectedCandidates.length > 0 && (
          <section className="decisions-section">
            <div className="section-header rejected">
              <FiXCircle />
              <h2>Rejected Candidates ({rejectedCandidates.length})</h2>
            </div>
            <div className="candidates-list">
              {rejectedCandidates.map((invitation) => (
                <div key={invitation._id || invitation.id} className="candidate-card rejected">
                  <div className="candidate-info">
                    <div className="candidate-name">
                      {getStatusIcon("REJECTED")}
                      <h3>Employee ID: {invitation.employeeId}</h3>
                      <span className={`status-badge ${getStatusClass("REJECTED")}`}>
                        REJECTED
                      </span>
                    </div>
                    {invitation.hrNote && (
                      <p className="manager-note">
                        <strong>Note:</strong> {invitation.hrNote}
                      </p>
                    )}
                    {invitation.declineReason && (
                      <p className="decline-reason">
                        <strong>Decline Reason:</strong> {invitation.declineReason}
                      </p>
                    )}
                    <p className="invited-date">
                      Invited: {invitation.invitedAt
                        ? new Date(invitation.invitedAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pendingCandidates.length > 0 && (
          <section className="decisions-section">
            <div className="section-header pending">
              <FiClock />
              <h2>Pending Review ({pendingCandidates.length})</h2>
            </div>
            <div className="candidates-list">
              {pendingCandidates.map((invitation) => (
                <div key={invitation._id || invitation.id} className="candidate-card pending">
                  <div className="candidate-info">
                    <div className="candidate-name">
                      {getStatusIcon("PENDING")}
                      <h3>Employee ID: {invitation.employeeId}</h3>
                      <span className={`status-badge ${getStatusClass("PENDING")}`}>
                        WAITING
                      </span>
                    </div>
                    <p className="invited-date">
                      Invited: {invitation.invitedAt
                        ? new Date(invitation.invitedAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {invitations.length === 0 && (
          <div className="empty-state">
            <FiUsers size={48} />
            <p>No candidates have been sent to the manager yet.</p>
            <button
              className="primary-btn"
              onClick={() => navigate(`/hr/activities/${activityId}/staffing`)}
            >
              Go to Staffing Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
