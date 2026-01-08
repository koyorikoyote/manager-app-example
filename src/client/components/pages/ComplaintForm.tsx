import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useLanguage } from '../../contexts/LanguageContext';
import { complaintService } from '../../services/complaintService';
import { formatDateForInput } from '../../utils/dateUtils';

interface ComplaintFormData {
    dateOfOccurrence: string;
    complainerName: string;
    complainerContact: string;
    complaintContent: string;
    urgencyLevel: "High" | "Medium" | "Low";
    progressStatus: "OPEN" | "CLOSED" | "ON_HOLD";
    personInvolved: string;
    companyId?: number;
    responderId?: number;
    recorderId: number;
}

export const ComplaintForm: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = id !== 'new' && !!id;

    const [formData, setFormData] = useState<ComplaintFormData>({
        dateOfOccurrence: formatDateForInput(new Date()),
        complainerName: '',
        complainerContact: '',
        complaintContent: '',
        urgencyLevel: 'Medium',
        progressStatus: 'OPEN',
        personInvolved: '',
        companyId: undefined,
        responderId: undefined,
        recorderId: 1,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing) {
            // Load existing complaint for editing
            const loadComplaint = async () => {
                try {
                    setLoading(true);
                    const complaint = await complaintService.getById(id!);
                    setFormData({
                        dateOfOccurrence: complaint.dateOfOccurrence ? formatDateForInput(complaint.dateOfOccurrence) : '',
                        complainerName: complaint.complainerName || '',
                        complainerContact: complaint.complainerContact || '',
                        complaintContent: complaint.complaintContent || '',
                        urgencyLevel: complaint.urgencyLevel || 'Medium',
                        progressStatus: complaint.progressStatus || 'OPEN',
                        personInvolved: complaint.personInvolved || '',
                        companyId: complaint.companyId || undefined,
                        responderId: complaint.responderId || undefined,
                        recorderId: complaint.recorderId || 1,
                    });
                } catch {
                    setError('Failed to load complaint');
                } finally {
                    setLoading(false);
                }
            };
            loadComplaint();
        }
    }, [id, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditing) {
                await complaintService.update(parseInt(id!), formData);
            } else {
                // Create the data with required recorder object
                const createData = {
                    ...formData,
                    resolutionDate: null,
                    recorder: {
                        id: formData.recorderId,
                        name: 'Recorder',
                        employeeId: 'REC001'
                    }
                };
                await complaintService.create(createData);
            }
            navigate('/complaint-details');
        } catch {
            setError('Failed to save complaint');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof ComplaintFormData, value: string | number | null) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/complaint-details')}
                        className="flex items-center space-x-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{t('common.actions.back')}</span>
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
                        {isEditing ? t('common.actions.edit') + ' Complaint' : t('common.actions.new') + ' Complaint'}
                    </h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>{isEditing ? t('common.actions.edit') + ' Complaint' : t('common.actions.new') + ' Complaint'}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Date of Occurrence
                                </label>
                                <Input
                                    type="date"
                                    value={formData.dateOfOccurrence}
                                    onChange={(e) => handleInputChange('dateOfOccurrence', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Complainer Name
                                </label>
                                <Input
                                    value={formData.complainerName}
                                    onChange={(e) => handleInputChange('complainerName', e.target.value)}
                                    placeholder="Enter complainer name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Contact Information
                                </label>
                                <Input
                                    value={formData.complainerContact}
                                    onChange={(e) => handleInputChange('complainerContact', e.target.value)}
                                    placeholder="Enter contact information"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Person Involved
                                </label>
                                <Input
                                    value={formData.personInvolved}
                                    onChange={(e) => handleInputChange('personInvolved', e.target.value)}
                                    placeholder="Enter person involved"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Urgency Level
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    value={formData.urgencyLevel}
                                    onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Progress Status
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    value={formData.progressStatus}
                                    onChange={(e) => handleInputChange('progressStatus', e.target.value)}
                                >
                                    <option value="OPEN">{t('status.open')}</option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="CLOSED">{t('status.closed')}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                Complaint Content
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={4}
                                value={formData.complaintContent}
                                onChange={(e) => handleInputChange('complaintContent', e.target.value)}
                                placeholder="Enter complaint details"
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/complaint-details')}
                            >
                                {t('common.actions.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex items-center space-x-2"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                <span>{t('common.actions.save')}</span>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
