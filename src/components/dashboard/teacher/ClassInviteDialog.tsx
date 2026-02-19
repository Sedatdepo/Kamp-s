
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, Download, QrCode, Share2 } from 'lucide-react';
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

  // The invite link now points to the new student portal entry page
  const inviteLink = `${window.location.origin}/giris/${classCode}`;

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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({ title: 'Davet Linki Kopyalandı!' });
    } catch (err) {
      console.error('Clipboard API failed, falling back to execCommand.', err);
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast({ title: 'Davet Linki Kopyalandı!' });
      } catch (fallbackErr) {
        toast({
          title: 'Kopyalama Başarısız',
          description: 'Link otomatik olarak kopyalanamadı. Lütfen manuel olarak kopyalayın.',
          variant: 'destructive',
        });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const downloadQrCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${className}_Davet_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`Merhaba, "${className}" sınıfının öğrenci portalına bu linkten katılabilirsiniz: ${inviteLink}`);
    window.open(`https://wa.me/?text=${message}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode />
            {className} Sınıf Portalı
          </DialogTitle>
          <DialogDescription>
            Bu linki veya QR kodu öğrencilerle paylaşarak onların sınıfa ait bilgilere erişmesini sağlayın.
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
          <Label htmlFor="invite-link">Paylaşılabilir Portal Linki</Label>
          <div className="flex gap-2">
            <Input id="invite-link" value={inviteLink} readOnly />
            <Button onClick={copyLink} size="icon" variant="outline">
              <ClipboardCopy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="pt-4 border-t">
            <Button onClick={handleWhatsAppShare} className="w-full bg-green-500 hover:bg-green-600">
                <Share2 className="mr-2 h-4 w-4" /> WhatsApp ile Paylaş
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
