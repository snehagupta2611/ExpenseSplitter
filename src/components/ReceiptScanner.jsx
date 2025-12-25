import React, { useState } from 'react';
import { scanReceipt } from '../services/GeminiService';

const ReceiptScanner = ({ onScanComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const data = await scanReceipt(file);
      
      if (data) {
        onScanComplete(data);
        alert("Receipt Scanned Successfully!");
      }
    } catch (error) {
      console.error("Scanner Component Error:", error);
      alert(`AI Error: ${error.message || "Please try manual entry."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="receipt-scanner">
      <label className="scanner-label cursor-pointer">
        {loading ? (
          <span className="animate-pulse text-yellow-400">✨ AI is reading...</span>
        ) : (
          "📷 Scan Receipt with AI"
        )}
        <input 
          type="file" 
          accept=".jpg, .jpeg, .png, .webp" 
          onChange={handleFileChange} 
          disabled={loading}
          className="hidden" 
        />
      </label>
    </div>
  );
};

export default ReceiptScanner;