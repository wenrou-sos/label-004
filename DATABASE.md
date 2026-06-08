# 社区诊所慢病随访管理系统 - 数据库设计文档

## 一、数据库概述

- **数据库名称**：chronic_followup
- **字符集**：utf8mb4
- **排序规则**：utf8mb4_unicode_ci
- **数据库引擎**：InnoDB

## 二、ER图关系说明

```
User (医生) 1 ── N Patient (患者)
User 1 ── N FollowupPlan (随访计划)
User 1 ── N FollowupRecord (随访记录)

DiseaseType (疾病类型) 1 ── N Patient

Patient 1 ── N HealthRecord (健康记录)
Patient 1 ── N FollowupPlan
Patient 1 ── N FollowupRecord
Patient 1 ── N Alert (异常提醒)

FollowupPlan 1 ── N FollowupRecord

HealthRecord 1 ── N Alert
```

## 三、数据表详细设计

### 3.1 User 表（用户/医生表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 用户ID |
| username | VARCHAR(255) | UNIQUE, NOT NULL | 登录用户名 |
| password | VARCHAR(255) | NOT NULL | 密码（bcrypt加密） |
| realName | VARCHAR(255) | NOT NULL | 真实姓名 |
| title | VARCHAR(255) | NULL | 职称（主任医师/主治医师等） |
| phone | VARCHAR(50) | NULL | 联系电话 |
| email | VARCHAR(255) | NULL | 邮箱 |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'DOCTOR' | 角色（ADMIN/DOCTOR） |
| createdAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

### 3.2 DiseaseType 表（疾病类型表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 疾病ID |
| name | VARCHAR(255) | UNIQUE, NOT NULL | 疾病名称（高血压/糖尿病等） |
| code | VARCHAR(50) | UNIQUE, NOT NULL | 疾病编码（HTN/DM等） |
| description | TEXT | NULL | 疾病描述 |
| normalRange | JSON | NULL | 正常指标范围 |
| createdAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**初始数据**：
- 高血压 (HTN)：收缩压 90-140，舒张压 60-90
- 糖尿病 (DM)：空腹血糖 3.9-6.1，餐后血糖 ≤7.8

### 3.3 Patient 表（患者表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 患者ID |
| name | VARCHAR(255) | NOT NULL | 姓名 |
| gender | VARCHAR(10) | NOT NULL | 性别（男/女） |
| birthDate | DATE | NOT NULL | 出生日期 |
| idCard | VARCHAR(18) | UNIQUE, NOT NULL | 身份证号 |
| phone | VARCHAR(50) | NOT NULL | 联系电话 |
| address | VARCHAR(500) | NULL | 居住地址 |
| bloodType | VARCHAR(10) | NULL | 血型（A/B/AB/O） |
| height | FLOAT | NULL | 身高（cm） |
| weight | FLOAT | NULL | 体重（kg） |
| allergies | TEXT | NULL | 过敏史 |
| medicalHistory | TEXT | NULL | 既往病史 |
| createdAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |
| doctorId | INT | NOT NULL, FOREIGN KEY → User(id) | 主治医生ID |
| diseaseTypeId | INT | NOT NULL, FOREIGN KEY → DiseaseType(id) | 疾病类型ID |

### 3.4 FollowupPlan 表（随访计划表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 计划ID |
| patientId | INT | NOT NULL, FOREIGN KEY → Patient(id) ON DELETE CASCADE | 患者ID |
| doctorId | INT | NOT NULL, FOREIGN KEY → User(id) | 医生ID |
| planDate | DATETIME | NOT NULL | 计划随访日期 |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'PENDING' | 状态（PENDING/COMPLETED/CANCELLED） |
| frequency | VARCHAR(50) | NULL | 随访频率（DAILY/WEEKLY/BIWEEKLY/MONTHLY/QUARTERLY） |
| notes | TEXT | NULL | 备注 |
| createdAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

### 3.5 HealthRecord 表（健康记录表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 记录ID |
| patientId | INT | NOT NULL, FOREIGN KEY → Patient(id) ON DELETE CASCADE | 患者ID |
| recordDate | DATETIME | NOT NULL | 记录日期 |
| systolic | FLOAT | NULL | 收缩压（mmHg） |
| diastolic | FLOAT | NULL | 舒张压（mmHg） |
| heartRate | INT | NULL | 心率（次/分） |
| fastingGlucose | FLOAT | NULL | 空腹血糖（mmol/L） |
| postprandialGlucose | FLOAT | NULL | 餐后血糖（mmol/L） |
| cholesterol | FLOAT | NULL | 总胆固醇（mmol/L） |
| triglycerides | FLOAT | NULL | 甘油三酯（mmol/L） |
| weight | FLOAT | NULL | 体重（kg） |
| note | TEXT | NULL | 备注 |
| createdAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

### 3.6 FollowupRecord 表（随访记录表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 记录ID |
| patientId | INT | NOT NULL, FOREIGN KEY → Patient(id) ON DELETE CASCADE | 患者ID |
| doctorId | INT | NOT NULL, FOREIGN KEY → User(id) | 医生ID |
| planId | INT | NULL, FOREIGN KEY → FollowupPlan(id) ON DELETE SET NULL | 关联计划ID |
| visitDate | DATETIME | NOT NULL | 就诊日期 |
| chiefComplaint | TEXT | NULL | 主诉 |
| examination | TEXT | NULL | 检查结果 |
| diagnosis | TEXT | NULL | 诊断 |
| treatment | TEXT | NULL | 治疗方案 |
| medication | TEXT | NULL | 用药建议 |
| advice | TEXT | NULL | 健康指导/建议 |
| nextVisitDate | DATETIME | NULL | 下次复诊日期 |
| createdAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

### 3.7 Alert 表（异常提醒表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 提醒ID |
| patientId | INT | NOT NULL, FOREIGN KEY → Patient(id) ON DELETE CASCADE | 患者ID |
| recordId | INT | NULL, FOREIGN KEY → HealthRecord(id) ON DELETE SET NULL | 关联健康记录ID |
| alertType | VARCHAR(100) | NOT NULL | 提醒类型（HEALTH_ABNORMAL等） |
| severity | VARCHAR(50) | NOT NULL | 严重程度（LOW/MEDIUM/HIGH/CRITICAL） |
| message | VARCHAR(1000) | NOT NULL | 提醒消息内容 |
| indicator | VARCHAR(100) | NULL | 异常指标名称（systolic/diastolic等） |
| value | FLOAT | NULL | 异常指标数值 |
| isRead | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否已读 |
| resolved | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否已解决 |
| createdAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

## 四、索引设计

| 表名 | 索引字段 | 索引类型 | 说明 |
|------|----------|----------|------|
| User | username | UNIQUE | 用户名唯一索引 |
| Patient | idCard | UNIQUE | 身份证号唯一索引 |
| Patient | doctorId | INDEX | 按医生查询患者 |
| Patient | diseaseTypeId | INDEX | 按疾病类型查询患者 |
| Patient | name | INDEX | 按姓名搜索 |
| FollowupPlan | patientId | INDEX | 按患者查询计划 |
| FollowupPlan | doctorId | INDEX | 按医生查询计划 |
| FollowupPlan | planDate | INDEX | 按日期查询计划 |
| FollowupPlan | status | INDEX | 按状态筛选 |
| HealthRecord | patientId | INDEX | 按患者查询记录 |
| HealthRecord | recordDate | INDEX | 按记录日期查询 |
| FollowupRecord | patientId | INDEX | 按患者查询随访记录 |
| FollowupRecord | doctorId | INDEX | 按医生查询 |
| FollowupRecord | visitDate | INDEX | 按就诊日期查询 |
| Alert | patientId | INDEX | 按患者查询提醒 |
| Alert | severity | INDEX | 按严重程度筛选 |
| Alert | isRead | INDEX | 按已读状态筛选 |
| Alert | resolved | INDEX | 按解决状态筛选 |
| Alert | createdAt | INDEX | 按创建时间排序 |

## 五、数据初始化 SQL 脚本

可通过 Prisma 迁移命令自动创建表结构，并通过种子脚本初始化数据：

```bash
# 创建数据库
mysql -u root -ppassword -e "CREATE DATABASE chronic_followup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 执行迁移
npx prisma migrate dev

# 初始化种子数据
npx prisma db seed
```

种子数据将自动创建：
- 2个医生账号（admin/doctor1，密码均为 doctor123）
- 2种疾病类型（高血压、糖尿病）
- 3位示例患者
- 若干随访计划、健康记录示例数据
