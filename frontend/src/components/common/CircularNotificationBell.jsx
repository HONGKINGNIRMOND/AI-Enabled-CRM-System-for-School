import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, FileText, X } from 'lucide-react';
import { circularsAPI } from '../../services/api';
import { getReadIds, markRead } from '../Circulars/RecentCircularsPanel';

const CircularNotificationBell = () => {
    const [circulars, setCirculars] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [readIds, setReadIds] = useState(() => getReadIds());
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchCirculars();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchCirculars = async () => {
        try {
            const res = await circularsAPI.list();
            setCirculars(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch circulars for notification:', err);
        } finally {
            setLoading(false);
        }
    };

    const isNew = (dateString) => {
        return (new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24) <= 2;
    };

    // When user opens the bell dropdown — mark visible circulars as read
    const handleOpen = () => {
        const wasOpen = open;
        setOpen(v => !v);
        if (!wasOpen) {
            // Mark the latest 5 as read when dropdown opens
            const idsToMark = circulars.slice(0, 5).map(c => c.id);
            if (idsToMark.length > 0) {
                markRead(idsToMark);
                setReadIds(getReadIds());
            }
        }
    };

    const handleItemClick = (id) => {
        markRead([id]);
        setReadIds(getReadIds());
    };

    // Unread = not in readIds
    const unreadCount = circulars.filter(c => !readIds.has(String(c.id))).length;
    const latest = circulars.slice(0, 5);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title="Circular Notifications"
            >
                <Bell className="w-5 h-5" />
                {!loading && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-indigo-600" />
                            Circulars
                            {unreadCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full">
                                    {unreadCount} unread
                                </span>
                            )}
                        </span>
                        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                        {loading ? (
                            <div className="py-6 text-center text-sm text-gray-400">Loading...</div>
                        ) : latest.length === 0 ? (
                            <div className="py-6 text-center text-sm text-gray-400 italic">No circulars yet.</div>
                        ) : (
                            latest.map(c => {
                                const isUnread = !readIds.has(String(c.id));
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => handleItemClick(c.id)}
                                        className={`px-4 py-3 hover:bg-gray-50 transition cursor-pointer ${
                                            isNew(c.createdAt) && isUnread ? 'bg-indigo-50/40' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${isUnread ? 'text-indigo-500' : 'text-gray-300'}`} />
                                            <div className="min-w-0">
                                                <p className={`text-sm truncate flex items-center gap-1 ${isUnread ? 'font-semibold text-gray-800' : 'font-medium text-gray-500'}`}>
                                                    {c.title}
                                                    {isNew(c.createdAt) && isUnread && (
                                                        <span className="px-1 py-0.5 text-[8px] font-bold bg-indigo-500 text-white rounded shrink-0">NEW</span>
                                                    )}
                                                    {isUnread && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 ml-auto" />
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5 truncate">{c.message}</p>
                                                <p className="text-[10px] text-gray-300 mt-1">
                                                    {new Date(c.createdAt).toLocaleDateString()} · {c.createdBy}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <Link
                            to="/circulars"
                            onClick={() => setOpen(false)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                        >
                            View All Circulars →
                        </Link>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => {
                                    markRead(circulars.map(c => c.id));
                                    setReadIds(getReadIds());
                                }}
                                className="text-xs text-gray-400 hover:text-gray-600 transition"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CircularNotificationBell;
