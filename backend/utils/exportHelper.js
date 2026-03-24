const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const exportToExcel = async (data, fileName, sheetName = 'Report') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length > 0) {
    worksheet.columns = Object.keys(data[0]).map(key => ({ header: key.toUpperCase(), key }));
    data.forEach(item => worksheet.addRow(item));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

const exportToPDF = (data, title) => {
  const doc = new jsPDF();
  doc.text(title, 14, 15);
  
  if (data.length > 0) {
    const headers = Object.keys(data[0]).map(k => k.toUpperCase());
    const body = data.map(item => Object.values(item));
    
    doc.autoTable({
      head: [headers],
      body: body,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] } // Blue primary
    });
  }
  
  return doc.output('arraybuffer');
};

module.exports = { exportToExcel, exportToPDF };
