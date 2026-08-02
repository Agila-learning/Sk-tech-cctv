const express = require('express');
const mongoose = require('mongoose');
const { exportToExcel, exportToPDF } = require('./utils/exportHelper');

// Just test the function directly
async function test() {
  try {
    const data = [{ employee: 'John Doe', role: 'admin', date: '2023-01-01', status: 'present', hoursWorked: 8, checkIn: '09:00', checkOut: '17:00' }];
    
    // test excel
    const excelBuffer = await exportToExcel(data, 'test.xlsx');
    console.log('Excel buffer size:', excelBuffer.length);
    
    // test pdf
    const pdfBuffer = exportToPDF(data, 'test');
    console.log('PDF buffer size:', pdfBuffer.length);
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
test();
