/**
 * Barcode/QR Code Scanner Component
 * Uses html5-qrcode library for scanning
 */

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, Scan } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'barcode-scanner-' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success callback
          onScan(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Error callback (can be ignored for continuous scanning)
          // console.log('Scan error:', errorMessage);
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error('Scanner error:', err);
      setError('فشل تشغيل الماسح الضوئي. تأكد من السماح بالوصول للكاميرا.');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scan className="w-5 h-5" />
          مسح الباركود/QR
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div id={elementId} className="rounded-lg overflow-hidden" />

      <div className="mt-4 text-center text-sm text-gray-600">
        وجّه الكاميرا نحو الباركود أو رمز QR
      </div>
    </Card>
  );
}
