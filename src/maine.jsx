import { useState, useEffect } from "react";
import React from "react";
import { JobSection, JobModal, EmptyState } from "./job";
import Info from "./info";

export default function Main({ user, onLogout }) {
    const [jobs, setJobs] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("Applied");
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        loadJobs(user.id);
    }, [user.id]);

    const loadJobs = (userId) => {
        try {
            const savedJobs = localStorage.getItem(`career_garden_jobs_${userId}`);
            if (savedJobs) {
                const parsedJobs = JSON.parse(savedJobs);
                setJobs(parsedJobs.sort((a, b) => new Date(b.date) - new Date(a.date)));
            }
        } catch (error) {
            console.error("Error loading jobs:", error);
        }
    };

    const saveJobs = (userId, jobsToSave) => {
        try {
            localStorage.setItem(`career_garden_jobs_${userId}`, JSON.stringify(jobsToSave));
        } catch (error) {
            console.error("Error saving jobs:", error);
            alert("Failed to save. Your browser storage might be full.");
        }
    };

    const addJob = (job) => {
        let updatedJobs;
        if (editingJob) {
            updatedJobs = jobs.map((j) => (j.id === editingJob.id ? job : j));
            setEditingJob(null);
        } else {
            updatedJobs = [...jobs, job];
        }
        setJobs(updatedJobs);
        saveJobs(user.id, updatedJobs);
        setShowModal(false);
    };

    const handleEdit = (job) => {
        setEditingJob(job);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Remove this tree from your garden?")) {
            const updatedJobs = jobs.filter((j) => j.id !== id);
            setJobs(updatedJobs);
            saveJobs(user.id, updatedJobs);
        }
    };

    const filteredJobs = jobs.filter((job) =>
        job.company.toLowerCase().includes(search.toLowerCase())
    );

    const sortedJobs = [...filteredJobs].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    const applied = sortedJobs.filter((j) => j.status === "Applied");
    const interview = sortedJobs.filter((j) => j.status === "Interview");
    const rejected = sortedJobs.filter((j) => j.status === "Rejected");
    const accepted = sortedJobs.filter((j) => j.status === "Accepted");

    const tabs = [
        { key: "Applied", label: "🌱 Applied", jobs: applied },
        { key: "Interview", label: "🌿 Interview", jobs: interview },
        { key: "Accepted", label: "🌳 Accepted", jobs: accepted },
        { key: "Rejected", label: "🍂 Rejected", jobs: rejected },
    ];

    if (jobs.length === 0) {
        return (
            <>
                <StyleKeyframes />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    <Header
                        user={user}
                        onLogout={onLogout}
                        onInfo={() => setShowInfo(true)}
                        count={0}
                    />
                    <EmptyState onAdd={() => setShowModal(true)} />
                    {showModal && (
                        <JobModal
                            onClose={() => {
                                setShowModal(false);
                                setEditingJob(null);
                            }}
                            onSave={addJob}
                            editingJob={editingJob}
                        />
                    )}
                </div>
                {showInfo && <Info onClose={() => setShowInfo(false)} />}
            </>
        );
    }

    return (
        <>
            <StyleKeyframes />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <Header
                    user={user}
                    onLogout={onLogout}
                    onInfo={() => setShowInfo(true)}
                    count={jobs.length}
                />

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="🔍 Search by company name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-96 px-4 py-2.5 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                </div>

                {/* Segmented Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab.key
                                    ? "bg-emerald-600 text-white shadow-lg scale-105"
                                    : "bg-white/70 backdrop-blur border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                }`}
                        >
                            <span className="relative z-10">
                                {tab.label} ({tab.jobs.length})
                            </span>
                            {activeTab === tab.key && (
                                <span className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Active Tab Content */}
                {search && sortedJobs.length === 0 ? (
                    <p className="text-center text-emerald-600 text-sm">🌱 No companies found</p>
                ) : (
                    <JobSection
                        title={activeTab}
                        jobs={tabs.find((tab) => tab.key === activeTab)?.jobs || []}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}

                {/* Floating Add Button */}
                <button
                    onClick={() => setShowModal(true)}
                    className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white w-16 h-16 rounded-full font-semibold transition-all hover:scale-110 shadow-2xl flex items-center justify-center text-3xl z-50 animate-pulseSoft"
                    aria-label="Add job"
                    title="Plant a new seed"
                >
                    🌱
                </button>

                {showModal && (
                    <JobModal
                        onClose={() => {
                            setShowModal(false);
                            setEditingJob(null);
                        }}
                        onSave={addJob}
                        editingJob={editingJob}
                    />
                )}
            </div>

            {showInfo && <Info onClose={() => setShowInfo(false)} />}
        </>
    );
}

/* ---------- Small Components ---------- */

function Header({ user, onLogout, onInfo, count }) {
    return (
        <div className="flex justify-between items-center mb-6">
            <div>
                <p className="text-lg sm:text-xl font-light text-emerald-800">
                    welcome,{" "}
                    <span className="font-semibold">
                        {user.name?.split(" ")[0] || "gardener"}
                    </span>{" "}
                    👋
                </p>
                <p className="text-xs text-emerald-600 hidden sm:block">
                    your garden has {count} tree{count !== 1 ? "s" : ""}
                </p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onInfo}
                    className="px-4 py-2 text-xs sm:text-sm text-emerald-700 hover:text-emerald-900 rounded-full font-medium transition-colors"
                >
                    ℹ️ Info
                </button>
                <button
                    onClick={onLogout}
                    className="px-4 py-2 text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-full font-medium transition-colors"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
}

/* ---------- Inject keyframes once ---------- */
function StyleKeyframes() {
    return (
        <style>{`
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .animate-fadeUp { animation: fadeUp 0.45s ease-out forwards; }

      @keyframes pulseSoft {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      .animate-pulseSoft { animation: pulseSoft 3s ease-in-out infinite; }
    `}</style>
    );
}
