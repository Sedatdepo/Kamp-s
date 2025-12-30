
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, Download, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface ClassInviteDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  classCode: string;
  className: string;
}

export function ClassInviteDialog({ isOpen, setIsOpen, classCode, className }: ClassInviteDialogProps) {
  const { toast } = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // The invite link now points to the student tab with the class code
  const inviteLink = `${window.location.origin}/?tab=student&code=${classCode}&invite=true`;

  useEffect(() => {
    if (isOpen && inviteLink) {
      QRCode.toDataURL(inviteLink, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a', // slate-900
          light: '#0000' // transparent
        }
      }, (err, url) => {
        if (err) {
          console.error(err);
          return;
        }
        setQrCodeDataUrl(url);
      });
    }
  }, [isOpen, inviteLink]);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: 'Davet Linki Kopyalandı!' });
  };

  const downloadQrCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${className}_Davet_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode />
            {className} Sınıfına Davet Et
          </DialogTitle>
          <DialogDescription>
            Bu linki veya QR kodu öğrencilerle paylaşarak onların sınıfa kaydolmasını sağlayın.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="Sınıf Davet QR Kodu" className="rounded-lg border bg-white" />
          ) : (
            <div className="w-64 h-64 bg-gray-200 animate-pulse rounded-lg" />
          )}
           <Button variant="outline" size="sm" onClick={downloadQrCode} className="mt-4">
              <Download className="mr-2 h-4 w-4" />
              QR Kodu İndir
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-link">Paylaşılabilir Link</Label>
          <div className="flex gap-2">
            <Input id="invite-link" value={inviteLink} readOnly />
            <Button onClick={copyLink} size="icon" variant="outline">
              <ClipboardCopy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
