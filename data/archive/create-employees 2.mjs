import { generateMonthlyAccounts } from '../server/db-employees.js';
import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';

async function createEmployees() {
  console.log('🚀 Creating employee accounts...\n');

  // Get current month
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Supervisor names
  const supervisors = [
    'محمد أحمد - مشرف',
    'فاطمة علي - مشرف',
    'عمر حسن - مشرف'
  ];

  // Employee names
  const employees = [
    'سارة محمود',
    'أحمد خالد',
    'منى سعيد',
    'يوسف إبراهيم',
    'نور الدين',
    'ليلى عبدالله',
    'كريم مصطفى',
    'هدى رمضان',
    'طارق فؤاد',
    'ريم جمال'
  ];

  const allNames = [...supervisors, ...employees];

  try {
    // Generate accounts (assuming admin user ID is 1)
    const accounts = await generateMonthlyAccounts(allNames, month, 1);

    console.log(`✅ Created ${accounts.length} accounts successfully!\n`);

    // Create Excel file
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ['نوع الحساب', 'اسم الموظف', 'اسم المستخدم', 'كلمة المرور المؤقتة', 'الشهر', 'تاريخ الانتهاء'],
      ...accounts.map((acc, index) => [
        index < 3 ? 'مشرف' : 'موظف',
        acc.employeeName,
        acc.username,
        acc.tempPassword,
        acc.month,
        new Date(acc.expiresAt).toLocaleDateString('ar-EG'),
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 25 },
      { wch: 20 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'حسابات الموظفين');

    // Save Excel file
    const fileName = `/home/ubuntu/haderos-mvp/employee_accounts_${month}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    console.log(`📄 Excel file saved: ${fileName}\n`);

    // Display summary
    console.log('📊 Account Summary:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('👥 SUPERVISORS (3):');
    accounts.slice(0, 3).forEach((acc, i) => {
      console.log(`${i + 1}. ${acc.employeeName}`);
      console.log(`   Username: ${acc.username}`);
      console.log(`   Password: ${acc.tempPassword}`);
      console.log(`   Expires: ${new Date(acc.expiresAt).toLocaleDateString('ar-EG')}\n`);
    });

    console.log('👤 EMPLOYEES (10):');
    accounts.slice(3).forEach((acc, i) => {
      console.log(`${i + 1}. ${acc.employeeName}`);
      console.log(`   Username: ${acc.username}`);
      console.log(`   Password: ${acc.tempPassword}`);
      console.log(`   Expires: ${new Date(acc.expiresAt).toLocaleDateString('ar-EG')}\n`);
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ All accounts created successfully!');
    console.log(`📁 Credentials exported to: ${fileName}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating accounts:', error);
    process.exit(1);
  }
}

createEmployees();
