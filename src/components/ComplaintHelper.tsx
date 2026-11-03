import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { FileText, Download, Copy, Check } from 'lucide-react';

export const ComplaintHelper = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    suspectPhoneOrUpi: '',
    transactionId: '',
    bankName: '',
    brief: ''
  });
  const [copied, setCopied] = useState(false);

  const generateReportText = () => {
    return `CYBER FRAUD COMPLAINT SUMMARY FOR CYBERCRIME.GOV.IN / 1930
-----------------------------------------------------------
Date of Incident: ${formData.date}
Total Amount Lost: INR ${formData.amount || '0'}
Suspect Phone / UPI ID / Link: ${formData.suspectPhoneOrUpi || 'N/A'}
Victim Bank: ${formData.bankName || 'N/A'}
Bank Transaction Reference / UTR: ${formData.transactionId || 'N/A'}

Brief Incident Description:
${formData.brief || 'Details registered via Scam Shield India.'}
-----------------------------------------------------------
Generated via Scam Shield India Incident Helper`;
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Cyber Fraud Incident Complaint Report', 15, 20);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 28);
    doc.line(15, 32, 195, 32);

    const splitText = doc.splitTextToSize(generateReportText(), 180);
    doc.text(splitText, 15, 42);
    doc.save(`Cybercrime_Complaint_${formData.date}.pdf`);
  };

  const copyText = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 mt-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-3 bg-red-100 rounded-2xl text-red-600">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Complaint Report Helper</h2>
          <p className="text-xs text-slate-500 font-semibold">Generates formal formatted summary for 1930 & cybercrime.gov.in</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-semibold">
        <div>
          <label className="text-slate-600 block mb-1 text-xs font-bold uppercase tracking-wider">Incident Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
          />
        </div>
        <div>
          <label className="text-slate-600 block mb-1 text-xs font-bold uppercase tracking-wider">Amount Lost (INR)</label>
          <input
            type="number"
            placeholder="e.g. 5000"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
          />
        </div>
        <div>
          <label className="text-slate-600 block mb-1 text-xs font-bold uppercase tracking-wider">Suspect Phone / UPI ID</label>
          <input
            type="text"
            placeholder="e.g. fraudster@upi or 9876543210"
            value={formData.suspectPhoneOrUpi}
            onChange={(e) => setFormData({ ...formData, suspectPhoneOrUpi: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
          />
        </div>
        <div>
          <label className="text-slate-600 block mb-1 text-xs font-bold uppercase tracking-wider">Transaction ID / UTR</label>
          <input
            type="text"
            placeholder="e.g. 42918291038"
            value={formData.transactionId}
            onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      <div className="mt-4 text-sm font-semibold">
        <label className="text-slate-600 block mb-1 text-xs font-bold uppercase tracking-wider">Brief Incident Details</label>
        <textarea
          rows={3}
          placeholder="Explain what happened (e.g. got electricity cut SMS, opened link, entered UPI PIN)..."
          value={formData.brief}
          onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-600 resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={copyText}
          className="flex-1 flex items-center justify-center gap-2 p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl min-h-[48px] border border-slate-200 transition-all"
        >
          {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
          <span>{copied ? 'Copied Summary' : 'Copy Text Summary'}</span>
        </button>
        <button
          onClick={downloadPDF}
          className="flex-1 flex items-center justify-center gap-2 p-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl min-h-[48px] shadow-lg shadow-red-200 transition-all"
        >
          <Download className="w-5 h-5" />
          <span>Download PDF Report</span>
        </button>
      </div>
    </div>
  );
};