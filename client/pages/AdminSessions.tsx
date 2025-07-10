import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "../components/layout/dashboard-layout";

export default function AdminSessions() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const fetchSessions = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await apiClient.request<any>("/session-logs", { method: "GET" });
            setSessions(res);
        } catch (err: any) {
            setError(err.message || "Failed to fetch sessions");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (token: string) => {
        if (!window.confirm("Force logout this session?")) return;
        try {
            await apiClient.request(`/session-logs/${token}`, { method: "DELETE" });
            setSessions(sessions.filter((s: any) => s.token !== token));
        } catch (err: any) {
            alert(err.message || "Failed to delete session");
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const filteredSessions = sessions.filter((s: any) => {
        const q = search.toLowerCase();
        return (
            s.user?.username?.toLowerCase().includes(q) ||
            s.ipAddress?.toLowerCase().includes(q) ||
            s.token?.toLowerCase().includes(q)
        );
    });

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold mb-4">Faol sessiyalar</h1>
                <div className="max-w-md mb-4">
                    <Input
                        placeholder="Foydalanuvchi nomi, IP yoki token bo'yicha qidiring..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className=""
                    />
                </div>
                {loading ? (
                    <div className="py-16 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    </div>
                ) : error ? (
                    <div className="py-16 text-center text-destructive">{error}</div>
                ) : filteredSessions.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">Faol sessiyalar yo'q.</CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredSessions.map((s: any) => (
                            <Card key={s.token}>
                                <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4">
                                    <div>
                                        <div>Foydalanuvchi: {s.user?.username} (ID: {s.userId})</div>
                                        <div>IP: {s.ipAddress}</div>
                                        <div>Agent: {s.userAgent}</div>
                                        <div>Yaratilgan: {new Date(s.createdAt).toLocaleString()}</div>
                                        <div>Token: <span className="break-all">{s.token}</span></div>
                                    </div>
                                    <Button variant="destructive" onClick={() => handleDelete(s.token)}>
                                        Majburan chiqish
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
} 