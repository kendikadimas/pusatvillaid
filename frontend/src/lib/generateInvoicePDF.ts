import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

interface InvoiceSettings {
    settings_prop_name?: string;
    settings_website?: string;
    settings_email?: string;
    settings_wa?: string;
}

interface InvoiceBooking {
    booking_code?: string;
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
    check_in: string;
    check_out: string;
    total_nights: number;
    num_guests: number;
    base_price?: number;
    tax_amount?: number;
    admin_fee?: number;
    total_amount: number | string;
    payment_status: string;
    villa?: {
        name?: string;
        location?: string;
        check_in_time?: string;
        check_out_time?: string;
    };
    payment_method?: {
        name?: string;
    } | null;
}

export async function generateInvoicePDF(booking: InvoiceBooking, bookingCode: string, invoiceSettings?: InvoiceSettings) {
    const propName = invoiceSettings?.settings_prop_name || 'PusatVilla.id';
    const websiteUrl = invoiceSettings?.settings_website || 'https://pusatvillaid.com';
    const email = invoiceSettings?.settings_email || 'support@pusatvilla.id';
    const wa = invoiceSettings?.settings_wa || '+62 812-3456-7890';
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Colors
  const primaryBlue = '#22c55e';
  const darkBlue = '#1E3A8A';
  const lightGray = '#F1F5F9';
  const textGray = '#475569';
  const textDark = '#0F172A';
  
  // Header - Brand Section
  pdf.setFillColor(59, 130, 246); // Blue
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo placeholder (you can replace with actual logo)
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text(propName, 20, 20);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Platform Sewa Villa Premium', 20, 28);
  
  // Invoice Title
  pdf.setFontSize(20);
  pdf.setTextColor(30, 58, 138);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE PEMESANAN', 20, 55);
  
  // Booking Code Box
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(1);
  pdf.rect(20, 62, pageWidth - 40, 15, 'S');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'bold');
  pdf.text('KODE BOOKING:', 25, 70);
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text(bookingCode, 65, 70);
  
  // Date issued
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  const issueDate = format(new Date(), 'dd MMMM yyyy', { locale: localeID });
  pdf.text(`Diterbitkan: ${issueDate}`, pageWidth - 70, 70);
  
  let yPos = 90;
  
  // Guest Information Section
  pdf.setFillColor(241, 245, 249);
  pdf.rect(20, yPos, pageWidth - 40, 10, 'F');
  pdf.setFontSize(11);
  pdf.setTextColor(30, 58, 138);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMASI TAMU', 25, yPos + 7);
  
  yPos += 15;
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Nama Lengkap:', 25, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(booking.guest_name || '-', 70, yPos);
  
  yPos += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text('Email:', 25, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(booking.guest_email || '-', 70, yPos);
  
  yPos += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text('Nomor Telepon:', 25, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(booking.guest_phone || '-', 70, yPos);
  
  yPos += 15;
  
  // Villa Information Section
  pdf.setFillColor(241, 245, 249);
  pdf.rect(20, yPos, pageWidth - 40, 10, 'F');
  pdf.setFontSize(11);
  pdf.setTextColor(30, 58, 138);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMASI VILLA', 25, yPos + 7);
  
  yPos += 15;
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Nama Villa:', 25, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(booking.villa?.name || '-', 70, yPos);
  
  yPos += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text('Lokasi:', 25, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(15, 23, 42);
  const locationText = booking.villa?.location || '-';
  const splitLocation = pdf.splitTextToSize(locationText, pageWidth - 90);
  pdf.text(splitLocation, 70, yPos);
  
  yPos += 15;
  
  // Booking Details Section
  pdf.setFillColor(241, 245, 249);
  pdf.rect(20, yPos, pageWidth - 40, 10, 'F');
  pdf.setFontSize(11);
  pdf.setTextColor(30, 58, 138);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DETAIL PEMESANAN', 25, yPos + 7);
  
  yPos += 15;
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Check-in:', 25, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  const checkInText = format(parseISO(booking.check_in), 'dd MMMM yyyy', { locale: localeID });
  pdf.text(checkInText, 70, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`(Setelah ${booking.villa?.check_in_time?.substring(0, 5) || '14:00'} WIB)`, 120, yPos);
  
  yPos += 7;
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Check-out:', 25, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  const checkOutText = format(parseISO(booking.check_out), 'dd MMMM yyyy', { locale: localeID });
  pdf.text(checkOutText, 70, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`(Sebelum ${booking.villa?.check_out_time?.substring(0, 5) || '12:00'} WIB)`, 120, yPos);
  
  yPos += 7;
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Durasi Menginap:', 25, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${booking.total_nights} Malam`, 70, yPos);
  
  yPos += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text('Jumlah Tamu:', 25, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${booking.num_guests} Orang`, 70, yPos);
  
  yPos += 15;
  
  // Payment Details Section
  pdf.setFillColor(241, 245, 249);
  pdf.rect(20, yPos, pageWidth - 40, 10, 'F');
  pdf.setFontSize(11);
  pdf.setTextColor(30, 58, 138);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RINCIAN PEMBAYARAN', 25, yPos + 7);
  
  yPos += 15;
  
  // Payment table
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.1);
  
  // Base price
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Harga Sewa', 25, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Rp ${Number(booking.base_price).toLocaleString('id-ID')}`, pageWidth - 60, yPos, { align: 'right' });
  pdf.line(25, yPos + 2, pageWidth - 25, yPos + 2);
  yPos += 7;
  
  // Tax if exists
  if (booking.tax_amount && booking.tax_amount > 0) {
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Pajak', 25, yPos);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Rp ${Number(booking.tax_amount).toLocaleString('id-ID')}`, pageWidth - 60, yPos, { align: 'right' });
    pdf.line(25, yPos + 2, pageWidth - 25, yPos + 2);
    yPos += 7;
  }
  
  // Admin fee if exists
  if (booking.admin_fee && booking.admin_fee > 0) {
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Biaya Admin (${booking.payment_method?.name || 'Transfer'})`, 25, yPos);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Rp ${Number(booking.admin_fee).toLocaleString('id-ID')}`, pageWidth - 60, yPos, { align: 'right' });
    pdf.line(25, yPos + 2, pageWidth - 25, yPos + 2);
    yPos += 7;
  }
  
  yPos += 5;
  
  // Total - Highlighted
  pdf.setFillColor(59, 130, 246);
  pdf.rect(20, yPos - 5, pageWidth - 40, 12, 'F');
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL TERBAYAR', 25, yPos + 3);
  pdf.setFontSize(13);
  pdf.text(`Rp ${Number(booking.total_amount).toLocaleString('id-ID')}`, pageWidth - 60, yPos + 3, { align: 'right' });
  
  yPos += 20;
  
  // Payment Status
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Status Pembayaran:', 25, yPos);
  
  const statusText = booking.payment_status === 'paid' ? 'LUNAS' : 
                     booking.payment_status === 'pending' ? 'MENUNGGU VERIFIKASI' : 'BELUM BAYAR';
  const statusColor = booking.payment_status === 'paid' ? [34, 197, 94] : 
                      booking.payment_status === 'pending' ? [251, 146, 60] : [239, 68, 68];
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  pdf.text(statusText, 70, yPos);
  
  yPos += 10;
  
  // Footer Section
  const footerY = pageHeight - 30;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(20, footerY, pageWidth - 20, footerY);
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${propName} - Platform Sewa Villa Premium`, 20, footerY + 7);
  pdf.text(`Email: ${email}`, 20, footerY + 12);
  pdf.text(`WhatsApp: ${wa}`, 20, footerY + 17);
  pdf.text(`Website: ${websiteUrl}`, 20, footerY + 22);
  
  // Page number
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(8);
  pdf.text(`Halaman 1 dari 1`, pageWidth - 40, footerY + 22);
  
  // Important note box
  if (yPos < footerY - 20) {
    pdf.setFillColor(254, 249, 195);
    pdf.setDrawColor(234, 179, 8);
    pdf.rect(20, yPos, pageWidth - 40, 25, 'FD');
    pdf.setFontSize(9);
    pdf.setTextColor(161, 98, 7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('⚠ PENTING:', 25, yPos + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 53, 15);
    const notes = [
      '• Tunjukkan invoice ini atau sebutkan kode booking saat check-in',
      '• Konfirmasi check-in telah dikirim ke email Anda',
      '• Hubungi kami jika ada pertanyaan: ' + wa + ' (WhatsApp)'
    ];
    let noteY = yPos + 12;
    notes.forEach(note => {
      pdf.text(note, 25, noteY);
      noteY += 5;
    });
  }
  
  // Generate filename
  const filename = `Invoice-${bookingCode}-${format(new Date(), 'yyyyMMdd')}.pdf`;
  
  // Save PDF
  pdf.save(filename);
}
