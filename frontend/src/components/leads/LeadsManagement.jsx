import React, { useState, useEffect } from 'react';
import { Phone, Plus, Edit2, Trash2, Eye, Search, Filter, Download, Upload } from 'lucide-react';
import LeadForm from './LeadForm';
import LeadDetails from './LeadDetails';
import { leadsAPI } from '../../services/api';
import BulkUploadModal from '../common/BulkUploadModal';

const LeadsManagement = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [viewingLead, setViewingLead] = useState(null);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            const response = await leadsAPI.getAll();
            const data = response.data;
            if (data.success && data.data.leads) {
                setLeads(data.data.leads);
            } else {
                setLeads([]);
            }
        } catch (err) {
            console.error('Failed to load leads:', err);
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddLead = () => {
        setEditingLead(null);
        setShowForm(true);
    };

    const handleEditLead = (lead) => {
        setEditingLead(lead);
        setShowForm(true);
    };

    const handleViewLead = (lead) => {
        setViewingLead(lead);
    };

    const handleDeleteLead = async (id) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            try {
                await leadsAPI.delete(id);
                await loadLeads(); // Reload leads after deletion
            } catch (err) {
                console.error('Failed to delete lead:', err);
                alert(err.response?.data?.message || 'Failed to delete lead');
            }
        }
    };

    const handleSaveLead = async (leadData) => {
        try {
            if (editingLead) {
                await leadsAPI.update(editingLead.id, leadData);
            } else {
                await leadsAPI.create(leadData);
            }
            setShowForm(false);
            setEditingLead(null);
            await loadLeads(); // Reload leads after save
        } catch (err) {
            console.error('Failed to save lead:', err);
            alert(err.response?.data?.message || 'Failed to save lead');
        }
    };

    const handleBulkUpload = async (file) => {
        const response = await leadsAPI.bulkUpload(file);
        loadLeads();
        return response;
    };

    const handleInitiateCall = async (leadId) => {
        try {
            // This will be handled by the AICalls component
            window.location.href = `/ai-calls?leadId=${leadId}`;
        } catch (err) {
            console.error('Failed to initiate call:', err);
        }
    };

    const handleBackToList = () => {
        setViewingLead(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-blue-100 text-blue-800';
            case 'Contacted': return 'bg-yellow-100 text-yellow-800';
            case 'Qualified': return 'bg-purple-100 text-purple-800';
            case 'Unqualified': return 'bg-gray-100 text-gray-800';
            case 'Converted': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (viewingLead) {
        return (
            <LeadDetails
                lead={viewingLead}
                onBack={handleBackToList}
                onEdit={handleEditLead}
                onDelete={handleDeleteLead}
                onInitiateCall={handleInitiateCall}
            />
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Leads Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-all"
                    >
                        <Upload size={18} />
                        <span>Bulk Upload</span>
                    </button>
                    <button
                        onClick={handleAddLead}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-all"
                    >
                        <Plus size={18} />
                        <span>Add Lead</span>
                    </button>
                </div>
            </div>

            {showForm ? (
                <LeadForm
                    lead={editingLead}
                    onSave={handleSaveLead}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingLead(null);
                    }}
                />
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex space-x-2 w-full sm:w-auto">
                            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <Filter size={16} />
                                <span>Filter</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <Download size={16} />
                                <span>Export</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredLeads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{lead.name || lead.fullName || 'N/A'}</div>
                                                <div className="text-sm text-gray-500">{lead.source || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{lead.company || lead.companyName || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{lead.email || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 flex items-center">
                                                    <Phone size={14} className="mr-1" />
                                                    {lead.phone || lead.phoneNumber || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status || 'New')}`}>
                                                    {lead.status || 'New'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {lead.lastContact ? new Date(lead.lastContact).toLocaleDateString() : lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewLead(lead)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditLead(lead)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLead(lead.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {showBulkModal && (
                <BulkUploadModal
                    title="Bulk Upload Leads"
                    onUpload={handleBulkUpload}
                    onCancel={() => setShowBulkModal(false)}
                    templateLink="http://localhost:3001/templates/leads_template.csv"
                />
            )}
        </div>
    );
};

export default LeadsManagement;