import React from 'react';
import { ArrowLeft, Phone, Mail, MapPin, Briefcase, Calendar, Edit2, Trash2, Star, MessageSquare, PhoneOutgoing } from 'lucide-react';

const LeadDetails = ({ lead, onBack, onEdit, onDelete, onInitiateCall }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
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

    if (!lead) {
        return (
            <div className="p-6">
                <p className="text-gray-500">No lead selected</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                >
                    <ArrowLeft size={18} className="mr-1" />
                    Back to Leads
                </button>
                <div className="flex space-x-2">
                    <button
                        onClick={() => onEdit(lead)}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Edit2 size={16} className="mr-1" />
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(lead.id)}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-red-50 text-red-600"
                    >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
                            <p className="text-gray-600">{lead.position} at {lead.company}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                            {lead.status}
                        </span>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Mail size={18} className="text-gray-500 mr-3" />
                                    <span className="text-gray-700">{lead.email}</span>
                                </div>
                                <div className="flex items-center">
                                    <Phone size={18} className="text-gray-500 mr-3" />
                                    <span className="text-gray-700">{lead.phone}</span>
                                </div>
                                <div className="flex items-center">
                                    <MapPin size={18} className="text-gray-500 mr-3" />
                                    <span className="text-gray-700">{lead.address || 'Address not provided'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Lead Details</h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Source</p>
                                    <p className="text-gray-700">{lead.source}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Created Date</p>
                                    <p className="text-gray-700">{formatDate(lead.createdAt || new Date())}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Last Contact</p>
                                    <p className="text-gray-700">{lead.lastContact ? formatDate(lead.lastContact) : 'Never'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700">{lead.notes || 'No notes added yet.'}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Interaction History</h2>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="mr-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Star size={14} className="text-blue-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h3 className="font-medium text-gray-800">Initial Contact</h3>
                                        <span className="text-sm text-gray-500">Today, 10:30 AM</span>
                                    </div>
                                    <p className="text-gray-600 text-sm">First contact made via email</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="mr-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <Phone size={14} className="text-green-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h3 className="font-medium text-gray-800">AI Call Attempt</h3>
                                        <span className="text-sm text-gray-500">Yesterday, 2:15 PM</span>
                                    </div>
                                    <p className="text-gray-600 text-sm">AI call initiated, customer engaged for 5 minutes</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={() => onInitiateCall(lead.id)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <PhoneOutgoing size={18} className="mr-2" />
                            Initiate AI Call
                        </button>
                        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <MessageSquare size={18} className="mr-2" />
                            Send Message
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadDetails;