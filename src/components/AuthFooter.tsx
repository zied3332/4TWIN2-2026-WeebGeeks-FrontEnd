import { Link } from "react-router-dom";

export default function AuthFooter() {
  return (
    <footer className="auth-footer">
      <div className="auth-footer-content">
        <div>
          <h4>IntelliHR</h4>
          <p>Internal employee platform for company use only.</p>
        </div>

        <div className="auth-footer-links">
          <Link to="/">Home</Link>
          <a href="/#features">Features</a>
          <a href="/#roles">Roles</a>
        </div>
      </div>
    </footer>
  );
}
