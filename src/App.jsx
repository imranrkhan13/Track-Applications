import { useState, useEffect } from "react";
import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import Main from "./maine";

// Login Screen
function LoginScreen({ onLoginSuccess }) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4 font-poppins">
            <div className="text-8xl mb-6 animate-[bounce_3s_infinite]">🌳</div>
            <h1 className="text-4xl sm:text-5xl font-light text-emerald-700 mb-2 text-center">
                Career Garden
            </h1>
            <p className="text-emerald-600 mb-8 text-center max-w-md">
                Track your job applications and watch your career grow with every seed you plant
            </p>

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

export default function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem("career_garden_user");
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
            } catch (error) {
                console.error("Error loading user:", error);
                localStorage.removeItem("career_garden_user");
            }
        }
        setIsLoading(false);
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        localStorage.setItem("career_garden_user", JSON.stringify(userData));
    };

    const handleLogout = () => {
        localStorage.removeItem("career_garden_user");
        setUser(null);
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 font-poppins">
                <div className="text-6xl animate-[bounce_3s_infinite]">🌱</div>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 font-poppins">
            <Main user={user} onLogout={handleLogout} />
        </div>
    );
}
