-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `realName` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'DOCTOR',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiseaseType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `normalRange` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DiseaseType_name_key`(`name`),
    UNIQUE INDEX `DiseaseType_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Patient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `birthDate` DATETIME(3) NOT NULL,
    `idCard` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `bloodType` VARCHAR(191) NULL,
    `height` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `allergies` VARCHAR(191) NULL,
    `medicalHistory` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `doctorId` INTEGER NOT NULL,
    `diseaseTypeId` INTEGER NOT NULL,

    UNIQUE INDEX `Patient_idCard_key`(`idCard`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowupPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `doctorId` INTEGER NOT NULL,
    `planDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `frequency` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HealthRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `recordDate` DATETIME(3) NOT NULL,
    `systolic` DOUBLE NULL,
    `diastolic` DOUBLE NULL,
    `heartRate` INTEGER NULL,
    `fastingGlucose` DOUBLE NULL,
    `postprandialGlucose` DOUBLE NULL,
    `cholesterol` DOUBLE NULL,
    `triglycerides` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowupRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `doctorId` INTEGER NOT NULL,
    `planId` INTEGER NULL,
    `visitDate` DATETIME(3) NOT NULL,
    `chiefComplaint` VARCHAR(191) NULL,
    `examination` VARCHAR(191) NULL,
    `diagnosis` VARCHAR(191) NULL,
    `treatment` VARCHAR(191) NULL,
    `medication` VARCHAR(191) NULL,
    `advice` VARCHAR(191) NULL,
    `nextVisitDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Alert` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `recordId` INTEGER NULL,
    `alertType` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `indicator` VARCHAR(191) NULL,
    `value` DOUBLE NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `resolved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_diseaseTypeId_fkey` FOREIGN KEY (`diseaseTypeId`) REFERENCES `DiseaseType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowupPlan` ADD CONSTRAINT `FollowupPlan_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowupPlan` ADD CONSTRAINT `FollowupPlan_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthRecord` ADD CONSTRAINT `HealthRecord_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowupRecord` ADD CONSTRAINT `FollowupRecord_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowupRecord` ADD CONSTRAINT `FollowupRecord_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowupRecord` ADD CONSTRAINT `FollowupRecord_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `FollowupPlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `HealthRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
