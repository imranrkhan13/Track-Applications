import { useState } from "react";

function Job() {
    const [companyname, setCompanyName] = useState("");
    const [role, setRole] = useState("");
    const Availablestatus = ["Applied", "Rejected", "Interview", "Accepted"];
    const [status, setStatus] = useState("");

    const statusMessages = {
        Applied: "Hope it changes to interview soon!",
        Rejected: "We go again.",
        Interview: "Hell yeah, you got this!",
        Accepted: "Congratulations, Time to start another chapter!!!"
    };

    return (
        <div>
            <h3>Company Name: {companyname}</h3>
            <h3>Role: {role}</h3>
            <h3>Status: {status}</h3>

            <input type="name"
                placeholder="Enter Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
            />
            <input type="name"
                placeholder="Enter Company Name"
                value={companyname}
                onChange={(e) => setCompanyName(e.target.value)}
            />
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}>
                <option value="">Select Status</option>
                {Availablestatus.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            <p>{statusMessages[status]}</p>
        </div>
    )
}
export default Job;