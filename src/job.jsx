import { useState } from "react";
import "./job.css";

function Job() {
    const [showForm, setShowForm] = useState(false);
    const [company, setCompany] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("Applied");

    return (
        <div className="app fade-in">
            <div className="job-view">
                <h1>Applied</h1>

                <div className="job-focus">
                    <p className="role">{role || "Your next opportunity"}</p> {/* Show the role or the default text */}
                    <p className="company">{company || "Add a job to begin"}</p> {/* Show the company or the default text */}
                </div>

                <button className="add-btn" onClick={() => setShowForm(true)}>
                    + Add New
                </button>
            </div>


            {showForm && (
                <div className="overlay">
                    <div className="form-card slide-up">
                        <h2>Add Job</h2>

                        <input
                            placeholder="Role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        />
                        <input
                            placeholder="Company"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                        />

                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option>Applied</option>
                            <option>Interview</option>
                            <option>Rejected</option>
                            <option>Accepted</option>
                        </select>

                        <button
                            className="save"
                            onClick={() => setShowForm(false)}
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Job;
