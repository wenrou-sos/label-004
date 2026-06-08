import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('doctor123', 10);

  const doctor = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      realName: '张医生',
      title: '主任医师',
      phone: '13800000001',
      email: 'admin@clinic.com',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { username: 'doctor1' },
    update: {},
    create: {
      username: 'doctor1',
      password: hashedPassword,
      realName: '李医生',
      title: '主治医师',
      phone: '13800000002',
      email: 'doctor1@clinic.com',
      role: 'DOCTOR',
    },
  });

  const hypertension = await prisma.diseaseType.upsert({
    where: { code: 'HTN' },
    update: {},
    create: {
      name: '高血压',
      code: 'HTN',
      description: '以体循环动脉血压增高为主要特征的慢性疾病',
      normalRange: {
        systolic: { min: 90, max: 140 },
        diastolic: { min: 60, max: 90 },
      },
    },
  });

  const diabetes = await prisma.diseaseType.upsert({
    where: { code: 'DM' },
    update: {},
    create: {
      name: '糖尿病',
      code: 'DM',
      description: '以高血糖为特征的代谢性疾病',
      normalRange: {
        fastingGlucose: { min: 3.9, max: 6.1 },
        postprandialGlucose: { min: 0, max: 7.8 },
      },
    },
  });

  const patient1 = await prisma.patient.upsert({
    where: { idCard: '110101196001011234' },
    update: {},
    create: {
      name: '王大爷',
      gender: '男',
      birthDate: new Date('1960-01-01'),
      idCard: '110101196001011234',
      phone: '13900000001',
      address: '北京市朝阳区建国路88号',
      bloodType: 'A',
      height: 170,
      weight: 75,
      allergies: '青霉素过敏',
      medicalHistory: '高血压10年，吸烟史30年',
      doctorId: doctor.id,
      diseaseTypeId: hypertension.id,
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { idCard: '110101196505055678' },
    update: {},
    create: {
      name: '李阿姨',
      gender: '女',
      birthDate: new Date('1965-05-05'),
      idCard: '110101196505055678',
      phone: '13900000002',
      address: '北京市海淀区中关村大街1号',
      bloodType: 'O',
      height: 160,
      weight: 65,
      allergies: '无',
      medicalHistory: '糖尿病5年',
      doctorId: doctor.id,
      diseaseTypeId: diabetes.id,
    },
  });

  await prisma.patient.upsert({
    where: { idCard: '110101195803159012' },
    update: {},
    create: {
      name: '赵大爷',
      gender: '男',
      birthDate: new Date('1958-03-15'),
      idCard: '110101195803159012',
      phone: '13900000003',
      address: '北京市西城区西单北大街100号',
      bloodType: 'B',
      height: 175,
      weight: 82,
      allergies: '磺胺类药物过敏',
      medicalHistory: '高血压合并糖尿病',
      doctorId: doctor.id,
      diseaseTypeId: hypertension.id,
    },
  });

  const today = new Date();

  await prisma.followupPlan.createMany({
    data: [
      {
        patientId: patient1.id,
        doctorId: doctor.id,
        planDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        status: 'PENDING',
        frequency: 'WEEKLY',
        notes: '每周复诊，监测血压',
      },
      {
        patientId: patient2.id,
        doctorId: doctor.id,
        planDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        frequency: 'BIWEEKLY',
        notes: '两周复诊一次，监测血糖',
      },
      {
        patientId: patient1.id,
        doctorId: doctor.id,
        planDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED',
        frequency: 'WEEKLY',
        notes: '常规随访',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.healthRecord.createMany({
    data: [
      {
        patientId: patient1.id,
        recordDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        systolic: 145,
        diastolic: 95,
        heartRate: 78,
        weight: 76,
      },
      {
        patientId: patient1.id,
        recordDate: new Date(today.getTime() - 23 * 24 * 60 * 60 * 1000),
        systolic: 142,
        diastolic: 92,
        heartRate: 76,
        weight: 75.5,
      },
      {
        patientId: patient1.id,
        recordDate: new Date(today.getTime() - 16 * 24 * 60 * 60 * 1000),
        systolic: 138,
        diastolic: 88,
        heartRate: 74,
        weight: 75,
      },
      {
        patientId: patient1.id,
        recordDate: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000),
        systolic: 158,
        diastolic: 102,
        heartRate: 82,
        weight: 75.2,
        note: '患者反馈近期血压波动较大',
      },
      {
        patientId: patient1.id,
        recordDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        systolic: 155,
        diastolic: 98,
        heartRate: 80,
        weight: 74.8,
      },
      {
        patientId: patient2.id,
        recordDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        fastingGlucose: 7.2,
        postprandialGlucose: 10.5,
        weight: 66,
      },
      {
        patientId: patient2.id,
        recordDate: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000),
        fastingGlucose: 6.8,
        postprandialGlucose: 9.8,
        weight: 65.5,
      },
      {
        patientId: patient2.id,
        recordDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        fastingGlucose: 8.5,
        postprandialGlucose: 12.3,
        weight: 65,
        note: '近期血糖控制不佳',
      },
      {
        patientId: patient2.id,
        recordDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        fastingGlucose: 7.8,
        postprandialGlucose: 11.2,
        weight: 64.8,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Database seeded successfully!');
  console.log('Default accounts:');
  console.log('  admin / doctor123 (管理员)');
  console.log('  doctor1 / doctor123 (普通医生)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
