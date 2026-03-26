// src/pages/auth/Signup.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/auth.service";
import { getAllDepartments } from "../../services/departments.service";
import "../../auth-pages.css";

// ✅ Import image from src/assets
import authBg from "../../assets/logbackimg.png";

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  manager_id?: string;
}

export default function Signup() {
  const nav = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [departementId, setDepartementId] = useState("");
  const [password, setPassword] = useState("");

  const [matricule, setMatricule] = useState("");
  const [telephone, setTelephone] = useState("");
  const [dateEmbauche, setDateEmbauche] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [deptError, setDeptError] = useState("");

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepts(true);
        const depts = await getAllDepartments();
        setDepartments(depts);
      } catch (err: any) {
        setDeptError(err?.message || "Failed to load departments");
        console.error("Error fetching departments:", err);
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerUser({
        name: fullName,
        email,
        password,
        departement_id: departementId,
        matricule,
        telephone,
        date_embauche: dateEmbauche,
      });

      nav("/auth/login");
    } catch (err: any) {
      setError(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      {/* LEFT */}
      <div
        className="auth-left"
        style={{
          backgroundImage: `
            linear-gradient(rgba(12, 79, 61, 0.85), rgba(12, 79, 61, 0.85)),
            url(${authBg})
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="auth-left-inner">
          <div className="auth-brand-mark">IntelliHR</div>

          <h1 className="auth-hero-title">Welcome to IntelliHR</h1>
          <p className="auth-hero-sub">
            Internal access for company staff. Create your account to start using
            your workspace.
          </p>

          <div className="auth-bullets">
            <div className="auth-bullet">
              <span className="auth-check">✓</span> Secure internal access
            </div>
            <div className="auth-bullet">
              <span className="auth-check">✓</span> Workforce intelligence
            </div>
            <div className="auth-bullet">
              <span className="auth-check">✓</span> Performance & skill tracking
            </div>
          </div>

          <div className="auth-left-foot">
            © {new Date().getFullYear()} IntelliHR
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-top">
            <div className="auth-card-brand">IntelliHR</div>
          </div>

          <div className="auth-title">Create account</div>
          <div className="auth-sub">Internal access only (company users).</div>

          {error ? <div className="auth-alert">{error}</div> : null}

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-grid2">
              <div className="auth-field">
                <label className="auth-label">Full name</label>
                <input
                  className="auth-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Department</label>
                {deptError && <div style={{ color: "#d32f2f", fontSize: "0.85rem", marginBottom: "4px" }}>{deptError}</div>}
                <select
                  className="auth-input"
                  value={departementId}
                  onChange={(e) => setDepartementId(e.target.value)}
                  disabled={loadingDepts}
                  style={{ cursor: loadingDepts ? "not-allowed" : "pointer" }}
                >
                  <option value="">
                    {loadingDepts ? "Loading departments..." : "Select a department"}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="auth-grid2">
              <div className="auth-field">
                <label className="auth-label">Matricule</label>
                <input
                  className="auth-input"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  placeholder="EMP-1023"
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Telephone</label>
                <input
                  className="auth-input"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+216 XX XXX XXX"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Hire date</label>
              <input
                className="auth-input"
                type="date"
                value={dateEmbauche}
                onChange={(e) => setDateEmbauche(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>

            <div className="auth-links">
              <span className="auth-muted">Already have an account?</span>
              <Link className="auth-link" to="/auth/login">
                Sign in
              </Link>
            </div>

            <div className="auth-help">
              Having trouble? <b>Contact HR:</b> hr@company.com
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}