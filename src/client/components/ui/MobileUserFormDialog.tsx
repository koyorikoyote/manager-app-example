import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
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

interface MobileUserFormData {
    username: string;
    email: string;
    displayName: string | null;
    phone: string | null;
    password?: string;
    newPassword?: string;
    mobileRoleId: number | null;
    staffId: number | null;
    isActive: boolean;
}

interface MobileUserFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    user: MobileUser | null;
    onSubmit: (data: MobileUserFormData) => Promise<void>;
}

export const MobileUserFormDialog: React.FC<MobileUserFormDialogProps> = ({
    isOpen,
    onClose,
    user,
    onSubmit,
}) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<MobileUserRole[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        displayName: "",
        phone: "",
        password: "",
        confirmPassword: "",
        mobileRoleId: "",
        staffId: "",
        isActive: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            loadRoles();
            loadStaff();
            if (user) {
                setFormData({
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName || "",
                    phone: user.phone || "",
                    password: "",
                    confirmPassword: "",
                    mobileRoleId: user.mobileRoleId?.toString() || "",
                    staffId: user.staffId?.toString() || "",
                    isActive: user.isActive,
                });
            } else {
                setFormData({
                    username: "",
                    email: "",
                    displayName: "",
                    phone: "",
                    password: "",
                    confirmPassword: "",
                    mobileRoleId: "",
                    staffId: "",
                    isActive: true,
                });
            }
            setErrors({});
        } else {
            // Reset form when dialog closes
            setFormData({
                username: "",
                email: "",
                displayName: "",
                phone: "",
                password: "",
                confirmPassword: "",
                mobileRoleId: "",
                staffId: "",
                isActive: true,
            });
            setErrors({});
        }
    }, [isOpen, user]);

    const loadRoles = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch("/api/mobile-users/roles/list", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const result = await response.json();
                setRoles(result.data || []);
            }
        } catch (error) {
            console.error("Error loading roles:", error);
        }
    };

    const loadStaff = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch("/api/staff?limit=1000", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const result = await response.json();
                setStaffList(result.data || []);
            }
        } catch (error) {
            console.error("Error loading staff:", error);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.username.trim()) {
            newErrors.username = t("mobileUserManagement.validation.usernameRequired");
        }
        if (!formData.email.trim()) {
            newErrors.email = t("mobileUserManagement.validation.emailRequired");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t("mobileUserManagement.validation.emailInvalid");
        }

        if (!user) {
            // Creating new user - password is required
            if (!formData.password) {
                newErrors.password = t("mobileUserManagement.validation.passwordRequired");
            } else if (formData.password.length < 8) {
                newErrors.password = t("mobileUserManagement.validation.passwordMinLength");
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = t(
                    "mobileUserManagement.validation.passwordsDoNotMatch"
                );
            }
        } else {
            // Editing existing user - password is optional
            // Only validate if password is provided
            if (formData.password || formData.confirmPassword) {
                if (formData.password && formData.password.length < 8) {
                    newErrors.password = t("mobileUserManagement.validation.passwordMinLength");
                }
                if (formData.password !== formData.confirmPassword) {
                    newErrors.confirmPassword = t(
                        "mobileUserManagement.validation.passwordsDoNotMatch"
                    );
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            const submitData: MobileUserFormData = {
                username: formData.username,
                email: formData.email,
                displayName: formData.displayName || null,
                phone: formData.phone || null,
                mobileRoleId: formData.mobileRoleId ? parseInt(formData.mobileRoleId) : null,
                staffId: formData.staffId ? parseInt(formData.staffId) : null,
                isActive: formData.isActive,
            };

            if (!user) {
                submitData.password = formData.password;
            } else if (formData.password) {
                submitData.newPassword = formData.password;
            }

            await onSubmit(submitData);
            onClose();
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-secondary-900">
                        {user
                            ? t("mobileUserManagement.editUser")
                            : t("mobileUserManagement.createUser")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-secondary-400 hover:text-secondary-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-secondary-900">
                            {t("mobileUserManagement.basicInformation")}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    {t("mobileUserManagement.fields.username")} *
                                </label>
                                <Input
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
                                    placeholder={t("mobileUserManagement.placeholders.enterUsername")}
                                    className={errors.username ? "border-red-500" : ""}
                                />
                                {errors.username && (
                                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    {t("mobileUserManagement.fields.email")} *
                                </label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    placeholder={t("mobileUserManagement.placeholders.enterEmail")}
                                    className={errors.email ? "border-red-500" : ""}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    {t("mobileUserManagement.fields.displayName")}
                                </label>
                                <Input
                                    value={formData.displayName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, displayName: e.target.value })
                                    }
                                    placeholder={t("mobileUserManagement.placeholders.enterDisplayName")}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    {t("mobileUserManagement.fields.phone")}
                                </label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                    placeholder={t("mobileUserManagement.placeholders.enterPhone")}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-secondary-900">
                            {t("mobileUserManagement.roleInformation")}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    {t("mobileUserManagement.fields.role")}
                                </label>
                                <select
                                    value={formData.mobileRoleId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, mobileRoleId: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">
                                        {t("mobileUserManagement.placeholders.selectRole")}
                                    </option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    {t("mobileUserManagement.fields.staff")}
                                </label>
                                <select
                                    value={formData.staffId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, staffId: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">
                                        {t("mobileUserManagement.placeholders.selectStaff")}
                                    </option>
                                    {staffList.map((staff) => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.name}
                                            {staff.employeeId ? ` (${staff.employeeId})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-secondary-900">
                            {t("mobileUserManagement.accountSettings")}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    {t("mobileUserManagement.fields.password")}{" "}
                                    {!user && "*"}
                                </label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    placeholder={
                                        user
                                            ? t("mobileUserManagement.placeholders.leaveBlankToKeep")
                                            : t("mobileUserManagement.placeholders.enterPassword")
                                    }
                                    className={errors.password ? "border-red-500" : ""}
                                    autoComplete="new-password"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    {t("mobileUserManagement.fields.confirmPassword")}{" "}
                                    {!user && "*"}
                                </label>
                                <Input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, confirmPassword: e.target.value })
                                    }
                                    placeholder={t("mobileUserManagement.placeholders.confirmPassword")}
                                    className={errors.confirmPassword ? "border-red-500" : ""}
                                    autoComplete="new-password"
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>
                            <div className="col-span-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) =>
                                            setFormData({ ...formData, isActive: e.target.checked })
                                        }
                                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm font-medium text-secondary-700">
                                        {t("mobileUserManagement.fields.isActive")}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-secondary-200">
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t("common.actions.cancel")}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading
                                ? t("common.status.saving")
                                : user
                                    ? t("common.actions.update")
                                    : t("common.actions.create")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
