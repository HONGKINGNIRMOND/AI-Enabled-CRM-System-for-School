import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, RefreshCw, Download } from 'lucide-react';

const BulkUploadModal = ({ title, onUpload, onCancel, templateLink }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size exceeds 10MB limit');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        setUploading(true);
        setError(null);
        try {
            const response = await onUpload(file);
            setResult(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <Upload className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
                            <p className="text-xs text-indigo-100 font-medium">Excel or CSV files only</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 sm:p-8">
                    {!result ? (
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                <FileText className="w-6 h-6 text-indigo-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        Please ensure your file follows our standard format.
                                        Columns required based on upload type:
                                    </p>
                                    <div className="mt-3 text-xs text-gray-600 bg-white p-3 rounded-lg border">
                                        <p className="font-bold mb-2">Template Formats:</p>
                                        <p>• <strong>Students:</strong> First Name, Last Name, Date of Birth, Gender, Blood Group, Phone, Email, Admission, Class, Section, Academic Year, Address, City, State, Pincode, Parent Name, Parent Phone, Parent Email</p>
                                        <p>• <strong>Teachers:</strong> Username, Full Name, Email, Phone, Password</p>
                                        <p>• <strong>Marks:</strong> Registration Number, Student Name, Subject, Exam Type, Marks, Max Marks, Grade</p>
                                        <p>• <strong>Attendance:</strong> Registration Number, Status, Date, Session, Remarks</p>
                                        <p>• <strong>Leads:</strong> Name, Email, Phone, Company, Status, Last Contact Date, Source</p>
                                    </div>
                                    {templateLink && (
                                        <div className="mt-4 space-y-3">
                                            <a
                                                href={templateLink}
                                                className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-bold text-sm transition-colors"
                                                download
                                            >
                                                <Download className="w-4 h-4" />
                                                Download Sample Template (CSV)
                                            </a>
                                            <div className="flex gap-2">
                                                <a
                                                    href="http://localhost:3001/templates/student_bulk_template.xlsx"
                                                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
                                                    download
                                                >
                                                    <Download className="w-3 h-3" />
                                                    Excel Version
                                                </a>
                                                <a
                                                    href="http://localhost:3001/templates/student_bulk_template.csv"
                                                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
                                                    download
                                                >
                                                    <Download className="w-3 h-3" />
                                                    CSV Version
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-3 text-xs text-gray-500 bg-white p-2 rounded-lg border">
                                        <p className="font-bold mb-1">General Requirements:</p>
                                        <p>• Date format: YYYY-MM-DD (e.g., 2010-05-15)</p>
                                        <p>• All fields except optional ones are required</p>
                                        <p>• Maximum file size: 10MB</p>
                                        <p>• Supported formats: Excel (.xlsx/.xls) and CSV (.csv)</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`group relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 ${file
                                    ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-500/10'
                                    : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
                                    }`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const droppedFile = e.dataTransfer.files[0];
                                    if (droppedFile) handleFileChange({ target: { files: [droppedFile] } });
                                }}
                            >
                                <input
                                    type="file"
                                    id="bulk-file"
                                    className="hidden"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="bulk-file" className="cursor-pointer block">
                                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 ${file ? 'bg-indigo-600 shadow-lg shadow-indigo-200 scale-110' : 'bg-gray-100 group-hover:bg-indigo-100'
                                        }`}>
                                        <Upload className={`w-8 h-8 transition-colors ${file ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'}`} />
                                    </div>
                                    <p className="text-gray-900 font-bold text-lg mb-1">
                                        {file ? file.name : 'Click to upload'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'or drag and drop your file here'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">Maximum file size: 10MB</p>
                                </label>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 animate-head-shake">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-6 py-3.5 text-gray-600 font-bold hover:bg-gray-100 rounded-2xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className={`flex-[2] flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 ${(!file || uploading) ? 'opacity-50 cursor-not-allowed grayscale' : ''
                                        }`}
                                >
                                    {uploading ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Start Magic Upload'
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Complete!</h3>
                            <div className="flex justify-center items-center gap-3 mb-8">
                                <span className="px-4 py-1.5 bg-green-50 text-green-700 text-sm font-bold rounded-full">
                                    {result.successCount} Success
                                </span>
                                {result.failCount > 0 && (
                                    <span className="px-4 py-1.5 bg-red-50 text-red-700 text-sm font-bold rounded-full">
                                        {result.failCount} Failed
                                    </span>
                                )}
                            </div>

                            {result.errors && result.errors.length > 0 && (
                                <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 text-left">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Error Details</p>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto bg-white p-4 text-left">
                                        <ul className="space-y-3">
                                            {result.errors.slice(0, 10).map((err, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                                    <div className="text-sm">
                                                        <span className="font-bold text-gray-900">
                                                            {err.registration_number || `Row ${err.row}`}
                                                        </span>
                                                        <p className="text-red-500 mt-0.5">{err.error}</p>
                                                    </div>
                                                </li>
                                            ))}
                                            {result.errors.length > 10 && (
                                                <li className="text-xs text-gray-400 font-medium italic pl-4.5 pt-2">
                                                    + {result.errors.length - 10} more errors
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={onCancel}
                                className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
                            >
                                Great, thanks!
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkUploadModal;
