import { useState, useEffect } from "react";
import React from "react";
import { GoogleLogin } from "@react-oauth/google";

// Tree based on the job status
const TreeIcons = {
    Applied: "🌱",
    Interview: "🌿",
    Rejected: "🍂",
    Accepted: "🌳"
};

// The starting page when there are no jobs added
function EmptyState({ onAdd }) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center text-center px-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            <div className="mb-8 text-6xl sm:text-9xl animate-bounce">🌱</div>
            <h1 className="text-4xl sm:text-6xl font-light text-emerald-700 mb-4 tracking-tight">Career Garden</h1>
            <p className="text-emerald-500 mb-12 text-sm sm:text-base">Watch your career grow with every application</p>
            <button
                onClick={onAdd}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-full font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base"
            >
                🌱 Plant Your First Seed
            </button>
        </div>
    );
}

// card of jobs
function JobCard({ job, onEdit, onDelete }) {
    const statusColors = {
        Applied: "bg-green-50 border-green-300",
        Interview: "bg-amber-50 border-amber-300",
        Rejected: "bg-gray-100 border-gray-300",
        Accepted: "bg-emerald-100 border-emerald-400"
    };

    return (
        <div className={`${statusColors[job.status]} p-3 sm:p-4 rounded-2xl hover:shadow-xl transition-all border-2 hover:-translate-y-1 relative overflow-hidden`}>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-t from-green-600/20 to-transparent"></div>

            <div className="text-center mb-2">
                <div className="text-4xl sm:text-5xl mb-1 transform hover:scale-110 transition-transform">
                    {TreeIcons[job.status]}
                </div>
            </div>

            <div className="text-center mb-2">
                <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-0.5 truncate">{job.company}</h4>
                <p className="text-emerald-700 font-medium text-xs truncate">{job.role}</p>
            </div>

            {job.notes && (
                <div className="mb-2 p-1.5 bg-white/60 rounded">
                    <p className="text-xs text-gray-700 italic text-center line-clamp-2">{job.notes}</p>
                </div>
            )}

            <div className="text-center mb-2">
                <span className="text-xs text-gray-600">{job.date}</span>
            </div>

            <div className="flex gap-1.5">
                <button
                    onClick={() => onEdit(job)}
                    className="flex-1 px-2 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                    ✏️ Tend
                </button>
                <button
                    onClick={() => onDelete(job.id)}
                    className="flex-1 px-2 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}

// Job Section 
function JobSection({ title, jobs, onEdit, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    if (jobs.length === 0) return null;

    const visible = expanded ? jobs : jobs.slice(0, 5);

    const sectionEmojis = {
        Applied: "🌱",
        Interview: "🌿",
        Rejected: "🍂",
        Accepted: "🌳"
    };

    return (
        <section className="mb-8 sm:mb-10">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">{sectionEmojis[title]}</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-emerald-800">{title}</h2>
                    <span className="bg-emerald-200 text-emerald-800 px-2 sm:px-3 py-1 rounded-full text-xs font-bold">
                        {jobs.length}
                    </span>
                </div>
                {jobs.length > 5 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-emerald-600 hover:text-emerald-800 font-semibold transition-colors text-xs sm:text-sm underline"
                    >
                        {expanded ? "Show less" : "View all"}
                    </button>
                )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {visible.map(job => (
                    <JobCard key={job.id} job={job} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        </section>
    );
}

// Job Modal
function JobModal({ onClose, onSave, editingJob }) {
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
            <div className="bg-gradient-to-br from-white to-green-50 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl border-2 border-emerald-200 my-8">
                <div className="text-center mb-4">
                    <div className="text-5xl mb-2">🌱</div>
                    <h3 className="text-2xl font-bold text-emerald-900">{editingJob ? 'Tend Your Tree' : 'Plant New Seed'}</h3>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1">🏢 Company</label>
                        <input
                            placeholder="e.g., Google"
                            value={company}
                            onChange={e => setCompany(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border-2 border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1">💼 Role</label>
                        <input
                            placeholder="e.g., Software Engineer"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border-2 border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1">🌱 Growth Stage</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border-2 border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm transition-all"
                        >
                            <option value="Applied">🌱 Seedling (Applied)</option>
                            <option value="Interview">🌿 Sprouting (Interview)</option>
                            <option value="Rejected">🍂 Withered (Rejected)</option>
                            <option value="Accepted">🌳 Bloomed (Accepted)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1">📅 Date Planted</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border-2 border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1">📝 Garden Notes (Optional)</label>
                        <textarea
                            placeholder="Add notes..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border-2 border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm transition-all h-20 resize-none"
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
                        {editingJob ? '🌿 Update' : '🌱 Plant'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// login
function LoginScreen({ onLoginSuccess }) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4">
            <div className="text-7xl sm:text-9xl mb-6 animate-bounce">🌳</div>
            <h1 className="text-4xl sm:text-5xl font-light text-emerald-700 mb-2 text-center">Career Garden</h1>
            <p className="text-emerald-600 mb-8 text-center max-w-md">Track your job applications and watch your career grow with every seed you plant</p>

            <div className="w-full max-w-sm">
                <GoogleLogin
                    onSuccess={(res) => {
                        const payload = JSON.parse(atob(res.credential.split(".")[1]));
                        onLoginSuccess({
                            id: payload.sub,
                            name: payload.name,
                            email: payload.email,
                            picture: payload.picture,
                        });
                    }}
                    onError={() => {
                        alert("Google Sign-In failed");
                    }}
                    size="large"
                    width="384"
                    text="continue_with"
                    shape="pill"
                    logo_alignment="left"
                />
            </div>

            <div className="mt-8 flex items-center gap-6 text-emerald-600">
                <div className="text-center">
                    <div className="text-3xl mb-1">🌱</div>
                    <p className="text-xs">Track</p>
                </div>
                <div className="text-center">
                    <div className="text-3xl mb-1">🌿</div>
                    <p className="text-xs">Grow</p>
                </div>
                <div className="text-center">
                    <div className="text-3xl mb-1">🌳</div>
                    <p className="text-xs">Succeed</p>
                </div>
            </div>
        </div>
    );
}

// main
export default function App() {
    const [jobs, setJobs] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // existing account logic
    useEffect(() => {
        const savedUser = localStorage.getItem('career_garden_user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                loadJobs(userData.id);
            } catch (error) {
                console.error('Error loading user:', error);
                localStorage.removeItem('career_garden_user');
            }
        }
        setIsLoading(false);
    }, []);

    // loading of jobs from localhost
    const loadJobs = (userId) => {
        try {
            const savedJobs = localStorage.getItem(`career_garden_jobs_${userId}`);
            if (savedJobs) {
                const parsedJobs = JSON.parse(savedJobs);
                setJobs(parsedJobs.sort((a, b) => new Date(b.date) - new Date(a.date)));
                console.log(`Loaded ${parsedJobs.length} jobs`);
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
        }
    };

    // job saved to localhost instead of window.saved
    const saveJobs = (userId, jobsToSave) => {
        try {
            localStorage.setItem(`career_garden_jobs_${userId}`, JSON.stringify(jobsToSave));
            console.log(`Saved ${jobsToSave.length} jobs`);
        } catch (error) {
            console.error('Error saving jobs:', error);
            alert('Failed to save. Your browser storage might be full.');
        }
    };

    // login 
    const handleLoginSuccess = (userData) => {
        console.log('Login success:', userData.email);
        setUser(userData);
        localStorage.setItem('career_garden_user', JSON.stringify(userData));
        loadJobs(userData.id);
    };

    // logout logic
    const handleLogout = () => {
        console.log('Logging out...');
        localStorage.removeItem('career_garden_user');
        setUser(null);
        setJobs([]);
        window.location.reload();
    };

    // addor update
    function addJob(job) {
        let updatedJobs;
        if (editingJob) {
            updatedJobs = jobs.map(j => j.id === editingJob.id ? job : j);
            setEditingJob(null);
        } else {
            updatedJobs = [...jobs, job];
        }
        setJobs(updatedJobs);
        saveJobs(user.id, updatedJobs);
        setShowModal(false);
    }

    function handleEdit(job) {
        setEditingJob(job);
        setShowModal(true);
    }

    function handleDelete(id) {
        if (window.confirm('Remove this tree from your garden?')) {
            const updatedJobs = jobs.filter(j => j.id !== id);
            setJobs(updatedJobs);
            saveJobs(user.id, updatedJobs);
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                <div className="text-6xl animate-bounce">🌱</div>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    const sortedJobs = [...jobs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const applied = sortedJobs.filter(j => j.status === "Applied");
    const interview = sortedJobs.filter(j => j.status === "Interview");
    const rejected = sortedJobs.filter(j => j.status === "Rejected");
    const accepted = sortedJobs.filter(j => j.status === "Accepted");

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            {jobs.length === 0 ? (
                <EmptyState onAdd={() => setShowModal(true)} />
            ) : (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    {/* user details */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            {/* {user.picture ? (
                                <img src={user.picture} alt={user.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-emerald-200" />
                            ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                                    {user.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )} */}
                            <div>
                                <p className="text-lg sm:text-xl font-light text-emerald-800">
                                    Hello, <span className="font-semibold">{user.name?.split(' ')[0] || 'Gardener'}</span> 👋
                                </p>
                                <p className="text-xs text-emerald-600 hidden sm:block">Your garden has {jobs.length} tree{jobs.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
                        >
                            Sign out
                        </button>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full font-semibold transition-all hover:scale-110 shadow-2xl flex items-center justify-center text-2xl sm:text-3xl z-50"
                    >
                        🌱
                    </button>

                    <JobSection title="Applied" jobs={applied} onEdit={handleEdit} onDelete={handleDelete} />
                    <JobSection title="Interview" jobs={interview} onEdit={handleEdit} onDelete={handleDelete} />
                    <JobSection title="Accepted" jobs={accepted} onEdit={handleEdit} onDelete={handleDelete} />
                    <JobSection title="Rejected" jobs={rejected} onEdit={handleEdit} onDelete={handleDelete} />
                </div>
            )}

            {showModal && <JobModal onClose={() => { setShowModal(false); setEditingJob(null); }} onSave={addJob} editingJob={editingJob} />}
        </div>
    );
}