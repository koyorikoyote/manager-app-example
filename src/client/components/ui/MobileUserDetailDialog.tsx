import React from "react";
import { X, Edit, Trash2 } from "lucide-react";
import { Button } from "./Button";
import { useLanguage } from "../../contexts/LanguageContext";

interface MobileUserRole {
    id: number;
    name: string;
    level: number;
}

interface Staff {
    id: number;
    name: string;
    employeeId: string | null;
}

interface MobileUser {
    id: number;
    username: string;
    email: string;
    displayName: string | null;
    phone: string | null;
    isActive: boolean;
    mobileRoleId: number | null;
    staffId: number | null;
    userId: number | null;
    createdAt: string;
    updatedAt: string;
    mobileRole: MobileUserRole | null;
    staff: Staff | null;
}

interface MobileUserDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    user: MobileUser | null;
    onEdit: (user: MobileUser) => void;
    onDelete: (id: string) => void;
}

export const MobileUserDetailDialog: React.FC<MobileUserDetailDialogProps> = ({
    isOpen,
    onClose,
    user,
    onEdit,
    onDelete,
}) => {
    const { t } = useLanguage();

    if (!isOpen || !user) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-secondary-900">
                        {t("mobileUserManagement.userDetails")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-secondary-400 hover:text-secondary-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-secondary-900">
                            {t("mobileUserManagement.basicInformation")}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-secondary-700">
                                    {t("mobileUserManagement.fields.username")}
                                </label>
                                <p className="mt-1 text-sm text-secondary-900">{user.username}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-secondary-700">
                                    {t("mobileUserManagement.fields.email")}
                                </label>
                                <p className="mt-1 text-sm text-secondary-900">{user.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-secondary-700">
                                    {t("mobileUserManagement.fields.displayName")}
                                </label>
                                <p className="mt-1 text-sm text-secondary-900">
                                    {user.displayName || "-"}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-secondary-700">
                                    {t("mobileUserManagement.fields.phone")}
                                </label>
                                <p className="mt-1 text-sm text-secondary-900">{user.phone || "-"}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-secondary-700">
                                    {t("mobileUserManagement.fields.role")}
                                </label>
                                <p className="mt-1 text-sm text-secondary-900">
                                    {user.mobileRole?.name || "-"}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-secondary-700">
                                    {t("mobileUserManagement.fields.staff")}
                                </label>
                                <p className="mt-1 text-sm text-secondary-900">
                                    {user.staff?.name || "-"}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-secondary-700">
                                    {t("mobileUserManagement.fields.status")}
                                </label>
                                <p className="mt-1">
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${user.isActive
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {user.isActive
                                            ? t("common.status.active")
                                            : t("common.status.inactive")}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-secondary-900">
                            {t("mobileUserManagement.systemInformation")}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-secondary-700">
                                    {t("mobileUserManagement.fields.createdAt")}
                                </label>
                                <p className="mt-1 text-sm text-secondary-900">
                                    {formatDate(user.createdAt)}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-secondary-700">
                                    {t("mobileUserManagement.fields.updatedAt")}
                                </label>
                                <p className="mt-1 text-sm text-secondary-900">
                                    {formatDate(user.updatedAt)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-secondary-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-secondary-200">
                    <Button
                        variant="outline"
                        onClick={() => onDelete(user.id.toString())}
                        className="text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("common.actions.delete")}
                    </Button>
                    <Button onClick={() => onEdit(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t("common.actions.edit")}
                    </Button>
                </div>
            </div>
        </div>
    );
};
