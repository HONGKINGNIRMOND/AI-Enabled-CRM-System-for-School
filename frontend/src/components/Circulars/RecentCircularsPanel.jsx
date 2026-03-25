import React, { useState, useMemo, useCallback } from 'react';
import {
    FileText, Search, Paperclip, RotateCcw, Trash2, Loader2,
    Bell, Star, SlidersHorizontal, X, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Eye
} from 'lucide-react';

// ─── localStorage read-tracking helpers (shared with NotificationBell) ─────────
const STORAGE_KEY = 'crm_read_circular_ids';

export const getReadIds = () => {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
    catch { return new Set(); }
};

export const markRead = (ids) => {
    const existing = getReadIds();
    ids.forEach(id => existing.add(String(id)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing]));
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

// ─── Main Component ───────────────────────────────────────────────────────────
const RecentCircularsPanel = ({ circulars, loading, user, onDelete, onRefresh }) => {
    // Filter state
    const [listSearch, setListSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterAttachment, setFilterAttachment] = useState(false);
    const [filterNew, setFilterNew] = useState(false);
    const [filterUnread, setFilterUnread] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    // Read state
    const [readIds, setReadIds] = useState(() => getReadIds());

    // ── helpers ──────────────────────────────────────────────────────────────
    const isNew = useCallback((dateString) =>
        (new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24) <= 2, []);

    const handleMarkRead = useCallback((id) => {
        markRead([id]);
        setReadIds(getReadIds());
    }, []);

    const handleMarkAllRead = useCallback(() => {
        markRead(circulars.map(c => c.id));
        setReadIds(getReadIds());
    }, [circulars]);

    const clearFilters = () => {
        setListSearch(''); setFilterRole('all'); setFilterAttachment(false);
        setFilterNew(false); setFilterUnread(false);
        setStartDate(''); setEndDate('');
        setPage(1);
    };

    // ── derived values (memoized for 500+ performance) ────────────────────
    const _q = listSearch.toLowerCase();

    const filteredCirculars = useMemo(() => {
        return circulars.filter(c => {
            if (_q && !c.title?.toLowerCase().includes(_q) &&
                !c.message?.toLowerCase().includes(_q) &&
                !c.createdBy?.toLowerCase().includes(_q)) return false;
            if (filterRole !== 'all' && c.creatorRole !== filterRole) return false;
            if (filterAttachment && !(c.attachments?.length > 0)) return false;
            if (filterNew && !isNew(c.createdAt)) return false;
            if (filterUnread && readIds.has(String(c.id))) return false;
            if (startDate) {
                const s = new Date(startDate); s.setHours(0, 0, 0, 0);
                if (new Date(c.createdAt) < s) return false;
            }
            if (endDate) {
                const e = new Date(endDate); e.setHours(23, 59, 59, 999);
                if (new Date(c.createdAt) > e) return false;
            }
            return true;
        });
    }, [circulars, _q, filterRole, filterAttachment, filterNew, filterUnread, startDate, endDate, readIds, isNew]);

    // Reset to page 1 when filters change
    const totalPages = Math.max(1, Math.ceil(filteredCirculars.length / pageSize));
    const safePage = Math.min(page, totalPages);

    const pageItems = useMemo(() =>
        filteredCirculars.slice((safePage - 1) * pageSize, safePage * pageSize),
        [filteredCirculars, safePage, pageSize]);

    const unreadCount = useMemo(() =>
        circulars.filter(c => !readIds.has(String(c.id))).length, [circulars, readIds]);
    const newCount = useMemo(() =>
        circulars.filter(c => isNew(c.createdAt)).length, [circulars, isNew]);

    const hasActiveFilters = listSearch || filterRole !== 'all' || filterAttachment ||
        filterNew || filterUnread || startDate || endDate;

    const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

    // ── pagination range helper ───────────────────────────────────────────
    const getPageRange = () => {
        const delta = 2;
        const range = [];
        for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++) {
            range.push(i);
        }
        return range;
    };

    // ── filter change helpers that also reset page ─────────────────────
    const setFilter = (setter) => (val) => { setter(val); setPage(1); };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-6 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Recent Circulars
                    </h2>
                    {!loading && (
                        <span className="text-xs text-gray-400">
                            {filteredCirculars.length.toLocaleString()} of {circulars.length.toLocaleString()} total
                        </span>
                    )}
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full">
                            {unreadCount} unread
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead}
                            className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition">
                            <Eye className="w-3 h-3" /> Mark all read
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all ${showFilters || hasActiveFilters
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Filters{hasActiveFilters ? ' ●' : ''}
                    </button>
                    <button onClick={onRefresh} disabled={loading}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Refresh">
                        <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ── Filter Panel ───────────────────────────────────────────── */}
            {showFilters && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
                    <div className="flex flex-wrap gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input type="text" placeholder="Search title, message, sender..."
                                value={listSearch}
                                onChange={e => { setFilter(setListSearch)(e.target.value); }}
                                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
                        </div>
                        {/* Sender role */}
                        <select value={filterRole} onChange={e => setFilter(setFilterRole)(e.target.value)}
                            className="rounded-lg border border-gray-200 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-600 bg-white">
                            <option value="all">All Senders</option>
                            <option value="admin">Admin Only</option>
                            <option value="hod">HOD Only</option>
                        </select>
                    </div>

                    {/* Quick filter chips */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: `With Attachment`, icon: Paperclip, active: filterAttachment, toggle: () => setFilter(setFilterAttachment)(!filterAttachment) },
                            { label: `New Only (${newCount})`, icon: Bell, active: filterNew, toggle: () => setFilter(setFilterNew)(!filterNew), activeColor: 'bg-red-500 border-red-500' },
                            { label: `Unread Only (${unreadCount})`, icon: Star, active: filterUnread, toggle: () => setFilter(setFilterUnread)(!filterUnread), activeColor: 'bg-amber-500 border-amber-500' },
                        ].map(({ label, icon: Icon, active, toggle, activeColor = 'bg-indigo-600 border-indigo-600' }) => (
                            <button key={label} onClick={toggle}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? `${activeColor} text-white` : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
                                <Icon className="w-3 h-3" />{label}
                            </button>
                        ))}
                    </div>

                    {/* Date range */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-medium text-gray-500">Date Range:</span>
                        <input type="date" value={startDate}
                            onChange={e => { setStartDate(e.target.value); setPage(1); }}
                            className="rounded-lg border border-gray-200 text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-600 bg-white" />
                        <span className="text-gray-300 text-xs">to</span>
                        <input type="date" value={endDate}
                            onChange={e => { setEndDate(e.target.value); setPage(1); }}
                            className="rounded-lg border border-gray-200 text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-600 bg-white" />
                        {hasActiveFilters && (
                            <button onClick={clearFilters}
                                className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">
                                <X className="w-3 h-3" /> Clear all
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Body ───────────────────────────────────────────────────── */}
            <div className="px-6 py-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading circulars...
                    </div>
                ) : filteredCirculars.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-8 text-center">
                        {circulars.length === 0 ? 'No circulars available.' : 'No circulars match your filters.'}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {pageItems.map((circular) => {
                            const isUnread = !readIds.has(String(circular.id));
                            return (
                                <div key={circular.id}
                                    onClick={() => handleMarkRead(circular.id)}
                                    className={`border rounded-lg p-4 transition cursor-pointer relative group ${isNew(circular.createdAt) && isUnread
                                        ? 'border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50/40'
                                        : isUnread
                                            ? 'border-blue-100 bg-blue-50/10 hover:bg-blue-50/20'
                                            : 'border-gray-100 hover:bg-gray-50'}`}>

                                    {/* NEW badge */}
                                    {isNew(circular.createdAt) && isUnread && (
                                        <span className="absolute -top-2 -right-2 inline-flex rounded-full h-4 px-2 text-[8px] font-bold bg-indigo-500 text-white items-center justify-center">
                                            NEW
                                        </span>
                                    )}
                                    {/* Unread dot */}
                                    {isUnread && !isNew(circular.createdAt) && (
                                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-400 group-hover:opacity-50 transition" />
                                    )}

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`text-sm flex items-center gap-2 flex-wrap ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                                                {circular.title}
                                                {circular.scheduledDate && new Date(circular.scheduledDate) > new Date() && (
                                                    <span className="text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                                                        Scheduled
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{circular.message}</p>
                                            <p className="mt-1.5 text-[11px] text-gray-400">
                                                From: <span className="font-medium text-gray-500">{circular.createdBy}</span>
                                                {circular.creatorRole ? ` (${circular.creatorRole})` : ''}
                                                {' '}• {new Date(circular.createdAt).toLocaleString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {(user?.role === 'admin' || circular.creatorId === user?.id) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(circular.id); }}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0 opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {circular.attachments?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {circular.attachments.map((file) => (
                                                <a key={file.fileName} href={file.url} target="_blank" rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100">
                                                    <Paperclip className="w-3 h-3" />
                                                    <span className="truncate max-w-[180px]">{file.originalName}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Pagination Bar ─────────────────────────────────────────── */}
            {!loading && filteredCirculars.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-50 bg-gray-50 rounded-b-xl">
                    {/* Info + page size */}
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>
                            Showing <span className="font-semibold text-gray-700">
                                {((safePage - 1) * pageSize + 1).toLocaleString()}–{Math.min(safePage * pageSize, filteredCirculars.length).toLocaleString()}
                            </span> of <span className="font-semibold text-gray-700">{filteredCirculars.length.toLocaleString()}</span>
                        </span>
                        <select value={pageSize}
                            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-600">
                            {PAGE_SIZE_OPTIONS.map(n => (
                                <option key={n} value={n}>{n} / page</option>
                            ))}
                        </select>
                    </div>

                    {/* Page controls */}
                    <div className="flex items-center gap-1">
                        <button onClick={() => goToPage(1)} disabled={safePage === 1}
                            className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
                            <ChevronsLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => goToPage(safePage - 1)} disabled={safePage === 1}
                            className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page numbers */}
                        {safePage > 3 && totalPages > 5 && (
                            <>
                                <button onClick={() => goToPage(1)} className="w-8 h-8 text-xs rounded text-gray-500 hover:bg-indigo-50 transition">1</button>
                                {safePage > 4 && <span className="text-gray-300 px-1">…</span>}
                            </>
                        )}
                        {getPageRange().map(p => (
                            <button key={p} onClick={() => goToPage(p)}
                                className={`w-8 h-8 text-xs rounded font-medium transition ${p === safePage
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-500 hover:bg-indigo-50'}`}>
                                {p}
                            </button>
                        ))}
                        {safePage < totalPages - 2 && totalPages > 5 && (
                            <>
                                {safePage < totalPages - 3 && <span className="text-gray-300 px-1">…</span>}
                                <button onClick={() => goToPage(totalPages)} className="w-8 h-8 text-xs rounded text-gray-500 hover:bg-indigo-50 transition">{totalPages}</button>
                            </>
                        )}

                        <button onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages}
                            className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => goToPage(totalPages)} disabled={safePage === totalPages}
                            className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
                            <ChevronsRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecentCircularsPanel;
