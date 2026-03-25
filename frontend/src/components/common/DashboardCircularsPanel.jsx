import React, { useState, useEffect, useCallback } from 'react';
import { circularsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import RecentCircularsPanel from '../Circulars/RecentCircularsPanel';

/**
 * Self-contained wrapper that fetches circulars and renders the
 * full RecentCircularsPanel (with filters + read tracking) on dashboards.
 */
const DashboardCircularsPanel = () => {
    const { user } = useAuth();
    const [circulars, setCirculars] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadCirculars = useCallback(async () => {
        setLoading(true);
        try {
            const res = await circularsAPI.list();
            setCirculars(res.data.data || []);
        } catch (err) {
            console.error('Failed to load circulars for dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCirculars();
    }, [loadCirculars]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this circular? This will also delete attached files.')) return;
        try {
            await circularsAPI.delete(id);
            loadCirculars();
        } catch (err) {
            console.error('Failed to delete circular:', err);
        }
    };

    return (
        <RecentCircularsPanel
            circulars={circulars}
            loading={loading}
            user={user}
            onDelete={handleDelete}
            onRefresh={loadCirculars}
        />
    );
};

export default DashboardCircularsPanel;
