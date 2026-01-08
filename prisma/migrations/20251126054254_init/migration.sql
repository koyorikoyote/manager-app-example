-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `language_preference` ENUM('EN', 'JA') NOT NULL DEFAULT 'EN',
    `theme_preference` VARCHAR(50) NULL DEFAULT 'glass-blue',
    `role_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_id_idx`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_roles_name_key`(`name`),
    INDEX `user_roles_level_idx`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `employee_id` VARCHAR(50) NULL,
    `name` VARCHAR(100) NOT NULL,
    `position` VARCHAR(100) NULL,
    `department` VARCHAR(100) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `postal_code` VARCHAR(10) NULL,
    `address` TEXT NULL,
    `hire_date` DATE NULL,
    `salary` DECIMAL(10, 2) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    `residence_status` VARCHAR(100) NULL,
    `age` INTEGER NULL,
    `nationality` VARCHAR(100) NULL,
    `user_in_charge_id` INTEGER NULL,
    `companies_id` INTEGER NULL,
    `date_of_birth` DATE NULL,
    `education_name` JSON NULL,
    `education_type` JSON NULL,
    `emergency_contact_primary_email` VARCHAR(255) NULL,
    `emergency_contact_primary_name` VARCHAR(255) NULL,
    `emergency_contact_primary_number` VARCHAR(20) NULL,
    `emergency_contact_primary_relationship` VARCHAR(100) NULL,
    `emergency_contact_secondary_email` VARCHAR(255) NULL,
    `emergency_contact_secondary_name` VARCHAR(255) NULL,
    `emergency_contact_secondary_number` VARCHAR(20) NULL,
    `emergency_contact_secondary_relationship` VARCHAR(100) NULL,
    `family_children` INTEGER NULL,
    `family_spouse` BOOLEAN NULL,
    `fax` VARCHAR(20) NULL,
    `furigana_name` VARCHAR(255) NULL,
    `gender` ENUM('M', 'F') NULL,
    `hobby_and_interests` TEXT NULL,
    `japanese_proficiency` TEXT NULL,
    `japanese_proficiency_remarks` TEXT NULL,
    `mobile` VARCHAR(20) NULL,
    `motivation_to_come_japan` TEXT NULL,
    `period_of_stay_date_end` DATE NULL,
    `period_of_stay_date_start` DATE NULL,
    `photo` VARCHAR(500) NULL,
    `qualifications_and_licenses` TEXT NULL,
    `reason_for_applying` TEXT NULL,
    `remarks` TEXT NULL,
    `work_history_city_location` JSON NULL,
    `work_history_country_location` JSON NULL,
    `work_history_date_end` JSON NULL,
    `work_history_date_start` JSON NULL,
    `work_history_description` JSON NULL,
    `work_history_employment_type` JSON NULL,
    `work_history_name` JSON NULL,
    `work_history_position` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_employee_id_key`(`employee_id`),
    INDEX `staff_employee_id_idx`(`employee_id`),
    INDEX `staff_status_idx`(`status`),
    INDEX `staff_user_id_fkey`(`user_id`),
    INDEX `staff_user_in_charge_id_idx`(`user_in_charge_id`),
    INDEX `staff_companies_id_idx`(`companies_id`),
    INDEX `staff_status_department_idx`(`status`, `department`),
    INDEX `staff_status_user_id_idx`(`status`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `properties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_code` VARCHAR(50) NULL,
    `name` VARCHAR(255) NOT NULL,
    `postal_code` VARCHAR(10) NULL,
    `address` TEXT NOT NULL,
    `property_type` ENUM('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED_USE') NOT NULL,
    `manager_id` INTEGER NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'UNDER_CONSTRUCTION', 'SOLD') NOT NULL DEFAULT 'ACTIVE',
    `description` TEXT NULL,
    `contract_date` DATE NULL,
    `city` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `establishment_date` DATE NULL,
    `furigana_name` VARCHAR(255) NULL,
    `owner` VARCHAR(255) NULL,
    `owner_email` VARCHAR(255) NULL,
    `owner_fax` VARCHAR(20) NULL,
    `owner_phone` VARCHAR(20) NULL,
    `photo` VARCHAR(500) NULL,
    `prefecture` VARCHAR(100) NULL,
    `region` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `properties_property_code_key`(`property_code`),
    INDEX `properties_property_code_idx`(`property_code`),
    INDEX `properties_status_idx`(`status`),
    INDEX `properties_manager_id_fkey`(`manager_id`),
    INDEX `properties_status_property_type_idx`(`status`, `property_type`),
    INDEX `properties_status_manager_id_idx`(`status`, `manager_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `property_staff_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `room` VARCHAR(100) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `rent_price_high` DECIMAL(10, 2) NULL,
    `rent_price_low` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `property_staff_assignments_property_id_idx`(`property_id`),
    INDEX `property_staff_assignments_staff_id_idx`(`staff_id`),
    UNIQUE INDEX `property_staff_assignments_property_id_staff_id_start_date_key`(`property_id`, `staff_id`, `start_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_configurations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(50) NOT NULL,
    `data_type` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') NOT NULL DEFAULT 'STRING',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_configurations_key_key`(`key`),
    INDEX `system_configurations_category_idx`(`category`),
    INDEX `system_configurations_is_active_idx`(`is_active`),
    INDEX `system_configurations_created_by_fkey`(`created_by`),
    INDEX `system_configurations_category_is_active_idx`(`category`, `is_active`),
    INDEX `system_configurations_is_active_data_type_idx`(`is_active`, `data_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `device_info` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_sessions_user_id_idx`(`user_id`),
    INDEX `user_sessions_token_hash_idx`(`token_hash`),
    INDEX `user_sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `staff_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `check_in_time` DATETIME(3) NULL,
    `check_out_time` DATETIME(3) NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'SICK', 'VACATION') NOT NULL,
    `notes` TEXT NULL,
    `hours_worked` DECIMAL(4, 2) NULL,
    `created_by` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `attendance_records_staff_id_idx`(`staff_id`),
    INDEX `attendance_records_date_idx`(`date`),
    INDEX `attendance_records_status_idx`(`status`),
    INDEX `attendance_records_staff_id_date_idx`(`staff_id`, `date`),
    INDEX `attendance_records_date_status_idx`(`date`, `status`),
    UNIQUE INDEX `attendance_records_staff_id_date_key`(`staff_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interaction_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('DISCUSSION', 'INTERVIEW', 'CONSULTATION', 'OTHER') NOT NULL,
    `date` DATE NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NULL,
    `name` VARCHAR(255) NULL,
    `title` VARCHAR(255) NULL,
    `person_involved_staff_id` INTEGER NULL,
    `user_in_charge_id` INTEGER NULL,
    `person_concerned` VARCHAR(100) NULL,
    `location` TEXT NULL,
    `means` ENUM('Face-to-face', 'Online', 'Phone', 'Email') NULL,
    `response_details` TEXT NULL,
    `companies_id` INTEGER NULL,
    `replies_id_array` JSON NULL,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `interaction_records_type_idx`(`type`),
    INDEX `interaction_records_status_idx`(`status`),
    INDEX `interaction_records_date_idx`(`date`),
    INDEX `interaction_records_person_involved_staff_id_idx`(`person_involved_staff_id`),
    INDEX `interaction_records_user_in_charge_id_idx`(`user_in_charge_id`),
    INDEX `interaction_records_created_by_idx`(`created_by`),
    INDEX `interaction_records_companies_id_idx`(`companies_id`),
    INDEX `interaction_records_type_status_idx`(`type`, `status`),
    INDEX `interaction_records_date_type_idx`(`date`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` VARCHAR(50) NULL,
    `name` VARCHAR(255) NOT NULL,
    `postal_code` VARCHAR(10) NULL,
    `address` TEXT NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `website` VARCHAR(255) NULL,
    `industry` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `contact_person` VARCHAR(255) NULL,
    `hiring_vacancies` INTEGER NULL DEFAULT 0,
    `preferred_nationality` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `corporate_number` VARCHAR(20) NULL,
    `country` VARCHAR(100) NULL,
    `destination_average_age` VARCHAR(100) NULL,
    `destination_transfer` VARCHAR(255) NULL,
    `destination_work_environment` VARCHAR(255) NULL,
    `destination_work_place` VARCHAR(255) NULL,
    `establishment_date` DATE NULL,
    `furigana_name` VARCHAR(255) NULL,
    `job_allowances` VARCHAR(255) NULL,
    `job_contract_renewal_conditions` VARCHAR(255) NULL,
    `job_dispute_prevention_measures` VARCHAR(255) NULL,
    `job_employee_benefits` VARCHAR(255) NULL,
    `job_overtime_rate` VARCHAR(100) NULL,
    `job_past_recruitment_history` VARCHAR(255) NULL,
    `job_provisional_hiring_conditions` VARCHAR(255) NULL,
    `job_retirement_benefits` VARCHAR(255) NULL,
    `job_retirement_conditions` VARCHAR(255) NULL,
    `job_salary` VARCHAR(100) NULL,
    `job_salary_bonus` VARCHAR(255) NULL,
    `job_salary_increase_rate` VARCHAR(255) NULL,
    `job_selection_process` VARCHAR(255) NULL,
    `job_terms_and_conditions` VARCHAR(255) NULL,
    `photo` VARCHAR(500) NULL,
    `prefecture` VARCHAR(100) NULL,
    `preferred_age` VARCHAR(100) NULL,
    `preferred_education` VARCHAR(255) NULL,
    `preferred_experience` VARCHAR(255) NULL,
    `preferred_japanese_proficiency` VARCHAR(100) NULL,
    `preferred_personality` VARCHAR(255) NULL,
    `preferred_qualifications` VARCHAR(255) NULL,
    `preferred_status_of_residence` VARCHAR(100) NULL,
    `region` VARCHAR(100) NULL,
    `user_in_charge_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `companies_company_id_unique`(`company_id`),
    INDEX `companies_status_idx`(`status`),
    INDEX `companies_user_in_charge_id_idx`(`user_in_charge_id`),
    INDEX `companies_company_id_idx`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `type` ENUM('STAFF', 'PROPERTY', 'COMPANY', 'MANUAL') NOT NULL,
    `related_entity_id` VARCHAR(100) NOT NULL,
    `file_path` VARCHAR(500) NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `staff_id` INTEGER NULL,
    `companies_id` INTEGER NULL,
    `property_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `documents_type_idx`(`type`),
    INDEX `documents_status_idx`(`status`),
    INDEX `documents_related_entity_id_idx`(`related_entity_id`),
    INDEX `documents_staff_id_idx`(`staff_id`),
    INDEX `documents_companies_id_idx`(`companies_id`),
    INDEX `documents_property_id_idx`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaint_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date_of_occurrence` DATETIME(3) NOT NULL,
    `complainer_name` VARCHAR(255) NOT NULL,
    `complainer_contact` VARCHAR(50) NOT NULL,
    `person_involved` VARCHAR(255) NULL,
    `progress_status` ENUM('OPEN', 'CLOSED', 'ON_HOLD') NOT NULL DEFAULT 'OPEN',
    `urgency_level` ENUM('High', 'Medium', 'Low') NOT NULL,
    `complaint_content` TEXT NOT NULL,
    `responder_id` INTEGER NULL,
    `company_id` INTEGER NULL,
    `recorder_id` INTEGER NULL,
    `resolution_date` DATETIME(3) NULL,
    `replies_id_array` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `complaint_details_progress_status_idx`(`progress_status`),
    INDEX `complaint_details_date_of_occurrence_idx`(`date_of_occurrence`),
    INDEX `complaint_details_responder_id_idx`(`responder_id`),
    INDEX `complaint_details_company_id_idx`(`company_id`),
    INDEX `complaint_details_recorder_id_idx`(`recorder_id`),
    INDEX `complaint_details_progress_status_date_of_occurrence_idx`(`progress_status`, `date_of_occurrence`),
    INDEX `complaint_details_company_id_progress_status_idx`(`company_id`, `progress_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_record` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date_of_record` DATETIME(3) NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `condition_status` ENUM('Excellent', 'Good', 'Fair', 'Poor') NOT NULL,
    `feedback_content` TEXT NOT NULL,
    `contact_number` TEXT NULL,
    `photo` VARCHAR(500) NULL,
    `replies_id_array` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `daily_record_date_of_record_idx`(`date_of_record`),
    INDEX `daily_record_staff_id_idx`(`staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inquiries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date_of_inquiry` DATETIME(3) NOT NULL,
    `inquirer_name` VARCHAR(255) NOT NULL,
    `inquirer_contact` VARCHAR(50) NOT NULL,
    `company_id` INTEGER NULL,
    `type_of_inquiry` VARCHAR(255) NOT NULL,
    `inquiry_content` TEXT NOT NULL,
    `progress_status` ENUM('OPEN', 'CLOSED', 'ON_HOLD') NOT NULL DEFAULT 'OPEN',
    `responder_id` INTEGER NULL,
    `recorder_id` INTEGER NULL,
    `resolution_date` DATETIME(3) NULL,
    `replies_id_array` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `inquiries_progress_status_idx`(`progress_status`),
    INDEX `inquiries_date_of_inquiry_idx`(`date_of_inquiry`),
    INDEX `inquiries_company_id_idx`(`company_id`),
    INDEX `inquiries_responder_id_idx`(`responder_id`),
    INDEX `inquiries_recorder_id_idx`(`recorder_id`),
    INDEX `inquiries_progress_status_date_of_inquiry_idx`(`progress_status`, `date_of_inquiry`),
    INDEX `inquiries_company_id_progress_status_idx`(`company_id`, `progress_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_replies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `to_datetime` DATETIME(3) NULL,
    `from_datetime` DATETIME(3) NULL,
    `to_message` TEXT NULL,
    `from_message` TEXT NULL,
    `user_id` INTEGER NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `message_replies_user_id_idx`(`user_id`),
    INDEX `message_replies_is_read_idx`(`is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mobile_user_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `level` INTEGER NOT NULL,

    UNIQUE INDEX `mobile_user_roles_name_key`(`name`),
    UNIQUE INDEX `mobile_user_roles_level_key`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mobile_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `mobile_role_id` INTEGER NULL,
    `staff_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mobile_users_username_key`(`username`),
    UNIQUE INDEX `mobile_users_email_key`(`email`),
    INDEX `mobile_users_mobile_role_id_idx`(`mobile_role_id`),
    INDEX `mobile_users_staff_id_idx`(`staff_id`),
    INDEX `mobile_users_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mobile_refresh_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `device_id` VARCHAR(100) NULL,
    `user_agent` VARCHAR(255) NULL,
    `ip` VARCHAR(45) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mobile_refresh_tokens_user_id_idx`(`user_id`),
    INDEX `mobile_refresh_tokens_token_hash_idx`(`token_hash`),
    INDEX `mobile_refresh_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `user_roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_companies_id_fkey` FOREIGN KEY (`companies_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_user_in_charge_id_fkey` FOREIGN KEY (`user_in_charge_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_manager_id_fkey` FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `property_staff_assignments` ADD CONSTRAINT `property_staff_assignments_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `property_staff_assignments` ADD CONSTRAINT `property_staff_assignments_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `system_configurations` ADD CONSTRAINT `system_configurations_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interaction_records` ADD CONSTRAINT `interaction_records_companies_id_fkey` FOREIGN KEY (`companies_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interaction_records` ADD CONSTRAINT `interaction_records_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interaction_records` ADD CONSTRAINT `interaction_records_person_involved_staff_id_fkey` FOREIGN KEY (`person_involved_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interaction_records` ADD CONSTRAINT `interaction_records_user_in_charge_id_fkey` FOREIGN KEY (`user_in_charge_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_user_in_charge_id_fkey` FOREIGN KEY (`user_in_charge_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_companies_id_fkey` FOREIGN KEY (`companies_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_details` ADD CONSTRAINT `complaint_details_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_details` ADD CONSTRAINT `complaint_details_recorder_id_fkey` FOREIGN KEY (`recorder_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_details` ADD CONSTRAINT `complaint_details_responder_id_fkey` FOREIGN KEY (`responder_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_record` ADD CONSTRAINT `daily_record_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_recorder_id_fkey` FOREIGN KEY (`recorder_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_responder_id_fkey` FOREIGN KEY (`responder_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_replies` ADD CONSTRAINT `message_replies_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mobile_users` ADD CONSTRAINT `mobile_users_mobile_role_id_fkey` FOREIGN KEY (`mobile_role_id`) REFERENCES `mobile_user_roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mobile_users` ADD CONSTRAINT `mobile_users_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mobile_users` ADD CONSTRAINT `mobile_users_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mobile_refresh_tokens` ADD CONSTRAINT `mobile_refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `mobile_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
