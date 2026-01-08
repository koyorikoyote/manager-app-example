import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useLanguage } from '../../contexts/LanguageContext';
import { inquiryService } from '../../services/inquiryService';
import { formatDateForInput } from '../../utils/dateUtils';

interface InquiryFormData {
    dateOfInquiry: string;
    inquirerName: string;
    inquirerContact: string;
    inquiryContent: string;
    typeOfInquiry: string;
    progressStatus: "OPEN" | "CLOSED" | "ON_HOLD";
    companyId?: number;
    responderId?: number;
    recorderId: number;
}

export const InquiryForm: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = id !== 'new' && !!id;

    const [formData, setFormData] = useState<InquiryFormData>({
        dateOfInquiry: formatDateForInput(new Date()),
        inquirerName: '',
        inquirerContact: '',
        inquiryContent: '',
        typeOfInquiry: '',
        progressStatus: 'OPEN',
        companyId: undefined,
        responderId: undefined,
        recorderId: 1,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing) {
            // Load existing inquiry for editing
            const loadInquiry = async () => {
                try {
                    setLoading(true);
                    const inquiry = await inquiryService.getById(id!);
                    setFormData({
                        dateOfInquiry: inquiry.dateOfInquiry ? formatDateForInput(inquiry.dateOfInquiry) : '',
                        inquirerName: inquiry.inquirerName || '',
                        inquirerContact: inquiry.inquirerContact || '',
                        inquiryContent: inquiry.inquiryContent || '',
                        typeOfInquiry: inquiry.typeOfInquiry || '',
                        progressStatus: inquiry.progressStatus || 'OPEN',
                        companyId: inquiry.companyId || undefined,
                        responderId: inquiry.responderId || undefined,
                        recorderId: inquiry.recorderId || 1,
                    });
                } catch {
                    setError('Failed to load inquiry');
                } finally {
                    setLoading(false);
                }
            };
            loadInquiry();
        }
    }, [id, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditing) {
                await inquiryService.update(parseInt(id!), formData);
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
                await inquiryService.create(createData);
            }
            navigate('/inquiries-notifications');
        } catch {
            setError('Failed to save inquiry');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof InquiryFormData, value: string | number | null) => {
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
                        onClick={() => navigate('/inquiries-notifications')}
                        className="flex items-center space-x-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{t('common.actions.back')}</span>
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
                        {isEditing ? t('common.actions.edit') + ' Inquiry' : t('common.actions.new') + ' Inquiry'}
                    </h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="h-5 w-5" />
                        <span>{isEditing ? t('common.actions.edit') + ' Inquiry' : t('common.actions.new') + ' Inquiry'}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Date of Inquiry
                                </label>
                                <Input
                                    type="date"
                                    value={formData.dateOfInquiry}
                                    onChange={(e) => handleInputChange('dateOfInquiry', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Inquirer Name
                                </label>
                                <Input
                                    value={formData.inquirerName}
                                    onChange={(e) => handleInputChange('inquirerName', e.target.value)}
                                    placeholder="Enter inquirer name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Contact Information
                                </label>
                                <Input
                                    value={formData.inquirerContact}
                                    onChange={(e) => handleInputChange('inquirerContact', e.target.value)}
                                    placeholder="Enter contact information"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Type of Inquiry
                                </label>
                                <Input
                                    value={formData.typeOfInquiry}
                                    onChange={(e) => handleInputChange('typeOfInquiry', e.target.value)}
                                    placeholder="Enter inquiry type"
                                />
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
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                Inquiry Content
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={4}
                                value={formData.inquiryContent}
                                onChange={(e) => handleInputChange('inquiryContent', e.target.value)}
                                placeholder="Enter inquiry details"
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
                                onClick={() => navigate('/inquiries-notifications')}
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
