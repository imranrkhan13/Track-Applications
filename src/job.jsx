import { useState } from "react";
import React from "react";

// Tree Icons
export const TreeIcons = {
    Applied: "🌱",
    Interview: "🌿",
    Rejected: "🍂",
    Accepted: "🌳",
};

// Empty State
export function EmptyState({ onAdd }) {
    return (
        <div className="min-h-[70vh] flex flex-col justify-center items-center text-center px-4">
            <div className="mb-6 text-8xl animate-[bounce_3s_infinite]">🌱</div>
            <h1 className="text-4xl sm:text-5xl font-light text-emerald-700 mb-2 tracking-tight">
                Your garden is waiting
            </h1>
            <p className="text-emerald-600 mb-8 max-w-sm">
                Every application is a seed — some bloom, some teach. Nurture them here 🌿
            </p>
            <button
                onClick={onAdd}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
                🌱 Plant your first seed
            </button>
        </div>
    );
}

// Job Card
export function JobCard({ job, onEdit, onDelete }) {
    const statusStyles = {
        Applied: "bg-green-50 border-green-200",
        Interview: "bg-amber-50 border-amber-200",
        Rejected: "bg-stone-100 border-stone-300 opacity-90",
        Accepted: "bg-emerald-100 border-emerald-400 shadow-emerald-200/50",
    };

    return (
        <div
            className={`${statusStyles[job.status]} p-3 sm:p-4 rounded-2xl border relative overflow-hidden hover:shadow-xl transition-all hover:-translate-y-0.5`}
        >
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-t from-green-600/15 to-transparent" />
            <div className="text-center mb-2">
                <div className="text-4xl sm:text-5xl mb-1 transition-transform hover:scale-110">
                    {TreeIcons[job.status]}
                </div>
            </div>
            <div className="text-center mb-1">
                <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-0.5 truncate">
                    {job.company}
                </h4>
                <p className="text-emerald-700 font-medium text-xs truncate">{job.role}</p>
                <p className="text-[11px] italic text-gray-500 mt-1">
                    {job.status === "Accepted" && "🌳 Flourishing"}
                    {job.status === "Rejected" && "🍂 Letting go"}
                    {job.status === "Interview" && "🌿 Sprouting"}
                    {job.status === "Applied" && "🌱 Seedling"}
                </p>
            </div>

            {job.notes && (
                <div className="mb-2 p-1.5 bg-white/60 rounded">
                    <p className="text-xs text-gray-700 italic text-center line-clamp-2">
                        {job.notes}
                    </p>
                </div>
            )}

            <div className="text-center mb-2">
                <span className="text-xs text-gray-600">{job.date}</span>
            </div>

            <div className="flex gap-1.5">
                <button
                    onClick={() => onEdit(job)}
                    className="flex-1 px-2 py-1.5 text-xs bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors font-medium"
                >
                    ✏️ Tend
                </button>
                <button
                    onClick={() => onDelete(job.id)}
                    className="flex-1 px-2 py-1.5 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors font-medium"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}

// Job Section
export function JobSection({ title, jobs, onEdit, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    if (jobs.length === 0)
        return (
            <p className="text-center text-emerald-600 text-sm">
                No {title.toLowerCase()} jobs yet. 🌱
            </p>
        );

    const visible = expanded ? jobs : jobs.slice(0, 5);

    return (
        <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-emerald-800">{title}</h2>
                {jobs.length > 5 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs sm:text-sm underline decoration-emerald-300 underline-offset-4"
                    >
                        {expanded ? "Show less" : "View all"}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {visible.map((job, i) => (
                    <div key={job.id} className="animate-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
                        <JobCard job={job} onEdit={onEdit} onDelete={onDelete} />
                    </div>
                ))}
            </div>
        </section>
    );
}

// Job Modal
export function JobModal({ onClose, onSave, editingJob }) {
    const [company, setCompany] = useState(editingJob?.company || "");
    const [role, setRole] = useState(editingJob?.role || "");
    const [status, setStatus] = useState(editingJob?.status || "Applied");
    const [date, setDate] = useState(editingJob?.date || "");
    const [notes, setNotes] = useState(editingJob?.notes || "");

    function handleSubmit() {
        if (!company || !role || !date) return;
        onSave({ id: editingJob?.id || Date.now(), company, role, status, date, notes });
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
            <div className="bg-gradient-to-br from-white to-green-50 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl border border-emerald-200 my-8 animate-fadeUp">
                <div className="text-center mb-5">
                    <div className="text-5xl mb-2">🌱</div>
                    <h3 className="text-2xl font-bold text-emerald-900">
                        {editingJob ? "Tend your tree" : "Plant new seed"}
                    </h3>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1">
                            🏢 Company
                        </label>
                        <input
                            placeholder="e.g., Google"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1">
                            💼 Role
                        </label>
                        <input
                            placeholder="e.g., Software Engineer"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1">
                            🌱 Growth Stage
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm"
                        >
                            <option value="Applied">🌱 Seedling (Applied)</option>
                            <option value="Interview">🌿 Sprouting (Interview)</option>
                            <option value="Rejected">🍂 Withered (Rejected)</option>
                            <option value="Accepted">🌳 Bloomed (Accepted)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1">
                            📅 Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1">
                            📝 Notes (Optional)
                        </label>
                        <textarea
                            placeholder="Add notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm h-20 resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-emerald-800 hover:bg-emerald-100 rounded-xl font-semibold transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg text-sm"
                    >
                        {editingJob ? "🌿 Update" : "🌱 Plant"}
                    </button>
                </div>
            </div>
        </div>
    );
}
