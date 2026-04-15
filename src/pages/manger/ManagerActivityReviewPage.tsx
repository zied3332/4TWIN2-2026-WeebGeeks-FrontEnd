import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  getActivityById,
  getActivitySkills,
  type ActivityRecord,
  type ActivitySkillRecord,
} from "../../services/activities.service";
import {
  getActivityInvitations,
  getNextBackupCandidates,
} from "../../services/activityInvitations.service";
import type { ActivityInvitationItem } from "../../types/activity-invitations";
import "./ManagerActivityReviewPage.css";

type CandidateItem = {
  employeeId: string;
  name: string;
  finalScore: number;
  shortReason: string;
  rank: number;
  recommendationType: string;
};

export default function ManagerActivityReviewPage() {
  const { activityId = "" } = useParams();
  const navigate = useNavigate();

  // Activity data
  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [activitySkills, setActivitySkills] = useState<ActivitySkillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Candidates data
  const [hrSelectedCandidates, setHrSelectedCandidates] = useState<CandidateItem[]>([]);
  const [backupCandidates, setBackupCandidates] = useState<CandidateItem[]>([]);

  // Manager selection state
  const [selectedFinalIds, setSelectedFinalIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!activityId) return;
      setLoading(true);
      setError("");
      try {
        // Load activity details
        const activityData = await getActivityById(activityId);
        setActivity(activityData);

        // Load activity skills
        const skills = await getActivitySkills(activityId);
        setActivitySkills(skills);

        // Load invitations (suggested employees)
        const invitations = await getActivityInvitations(activityId);
        const invitedCandidates: CandidateItem[] = invitations
          .filter((inv: ActivityInvitationItem) => inv.status === "INVITED")
          .map((inv: ActivityInvitationItem, index: number) => ({
            employeeId: inv.employeeId,
            name: inv.employeeId, // Will be replaced with actual name when we have user data
            finalScore: 85 - index * 5, // Placeholder scoring
            shortReason: "Recommended by HR based on skills match",
            rank: index + 1,
            recommendationType: "PRIMARY",
          }));
        setHrSelectedCandidates(invitedCandidates);
        setSelectedFinalIds(invitedCandidates.map((c) => c.employeeId));

        // Load backup candidates
        const backups = await getNextBackupCandidates(activityId, 5);
        setBackupCandidates(
          backups.availableBackups.map((b) => ({
            employeeId: b.employeeId,
            name: b.name,
            finalScore: b.finalScore,
            shortReason: b.shortReason,
            rank: b.rank || 0,
            recommendationType: b.recommendationType || "BACKUP",
          }))
        );
      } catch (e: any) {
        console.error("Failed to load data:", e);
        setError(e?.message || "Failed to load activity data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activityId]);

  const finalSelected = useMemo(() => {
    return hrSelectedCandidates.filter((candidate) =>
      selectedFinalIds.includes(candidate.employeeId)
    );
  }, [hrSelectedCandidates, selectedFinalIds]);

  const toggleCandidate = (employeeId: string) => {
    setSelectedFinalIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleApprove = () => {
    window.alert(
      `Manager approved ${finalSelected.length} participants for "${activity?.title || "Activity"}". Backend endpoint comes next.`
    );
  };

  const handleReject = () => {
    window.alert(
      `Manager rejected or requested changes for "${activity?.title || "Activity"}". Backend endpoint comes next.`
    );
  };

  if (loading) {
    return (
      <div className="manager-review-page">
        <div className="manager-review-shell">
          <div style={{ textAlign: "center", padding: 40 }}>
            <p>Loading activity data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="manager-review-page">
        <div className="manager-review-shell">
          <div style={{ textAlign: "center", padding: 40, color: "#b91c1c" }}>
            <p>{error || "Activity not found"}</p>
            <button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-review-page">
      <div className="manager-review-shell">
        <div className="manager-review-header">
          <div>
            <span className="manager-review-kicker">Manager review</span>
            <h1>{activity?.title || "Activity review"}</h1>
            <p>
              Review the HR shortlist, adjust participants, and confirm the final list before employees are notified.
            </p>
          </div>
        </div>

        <div className="manager-review-stats">
          <div className="manager-review-stat-card">
            <span>Seats required</span>
            <strong>{activity?.availableSlots || 0}</strong>
          </div>
          <div className="manager-review-stat-card">
            <span>HR selected</span>
            <strong>{hrSelectedCandidates.length}</strong>
          </div>
          <div className="manager-review-stat-card">
            <span>Manager final</span>
            <strong>{finalSelected.length}</strong>
          </div>
          <div className="manager-review-stat-card">
            <span>Backup options</span>
            <strong>{backupCandidates.length}</strong>
          </div>
        </div>

        <div className="manager-review-layout">
          <section className="manager-review-panel">
            <div className="section-head">
              <h2>HR shortlisted employees</h2>
              <p>Manager can keep or remove participants from the shortlist.</p>
            </div>

            <div className="candidate-list">
              {hrSelectedCandidates.map((candidate) => {
                const selected = selectedFinalIds.includes(candidate.employeeId);

                return (
                  <div key={candidate.employeeId} className="manager-candidate-card">
                    <div className="candidate-main-row">
                      <div className="candidate-avatar">
                        {candidate.name?.charAt(0).toUpperCase() || "U"}
                      </div>

                      <div className="candidate-info">
                        <div className="candidate-title-row">
                          <h3>{candidate.name}</h3>
                          <span className="score-badge">
                            {candidate.finalScore}/100
                          </span>
                        </div>

                        <p>{candidate.shortReason}</p>

                        <div className="mini-chip-row">
                          <span>Rank #{candidate.rank}</span>
                          <span>{candidate.recommendationType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="candidate-actions-row">
                      <label className="select-checkbox">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCandidate(candidate.employeeId)}
                        />
                        <span>
                          {selected ? "Included in final list" : "Excluded from final list"}
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="manager-review-panel">
            <div className="section-head">
              <h2>Backup employees</h2>
              <p>Manager can use these later when backend support is added.</p>
            </div>

            <div className="candidate-list">
              {backupCandidates.length === 0 ? (
                <div className="empty-state-card">No backup candidates available.</div>
              ) : (
                backupCandidates.map((candidate) => (
                  <div key={candidate.employeeId} className="manager-candidate-card">
                    <div className="candidate-main-row">
                      <div className="candidate-avatar">
                        {candidate.name?.charAt(0).toUpperCase() || "U"}
                      </div>

                      <div className="candidate-info">
                        <div className="candidate-title-row">
                          <h3>{candidate.name}</h3>
                          <span className="score-badge">
                            {candidate.finalScore}/100
                          </span>
                        </div>

                        <p>{candidate.shortReason}</p>

                        <div className="mini-chip-row">
                          <span>Rank #{candidate.rank}</span>
                          <span>{candidate.recommendationType}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="manager-review-panel">
          <div className="section-head">
            <h2>Manager feedback</h2>
            <p>Add notes before approval or rejection.</p>
          </div>

          <textarea
            className="manager-review-textarea"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write manager review notes here..."
          />

          <div className="manager-review-actions">
            <button
              type="button"
              className="secondary-staffing-btn"
              onClick={() => navigate(-1)}
            >
              Back
            </button>

            <button
              type="button"
              className="danger-staffing-btn"
              onClick={handleReject}
            >
              Reject / Request changes
            </button>

            <button
              type="button"
              className="primary-staffing-btn"
              onClick={handleApprove}
            >
              Approve final participants
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}