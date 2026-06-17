<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pembayaran Ditolak</title>
    <style>
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            color: #1e293b;
        }
        .wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 24px 16px;
        }
        .card {
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .header {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            padding: 36px 32px 28px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 6px;
            letter-spacing: -0.3px;
        }
        .header p {
            color: #fee2e2;
            font-size: 14px;
            margin: 0;
        }
        .badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            padding: 4px 14px;
            border-radius: 20px;
            margin-top: 12px;
        }
        .body {
            padding: 32px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 24px;
        }
        .detail-table {
            width: 100%;
            border-collapse: collapse;
        }
        .detail-table tr {
            border-bottom: 1px solid #f1f5f9;
        }
        .detail-table td {
            padding: 12px 0;
            font-size: 14px;
            vertical-align: top;
        }
        .detail-table td:first-child {
            color: #64748b;
            width: 135px;
        }
        .detail-table td:last-child {
            font-weight: 600;
            color: #1e293b;
        }
        .section-title {
            font-size: 13px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 24px 0 12px;
            padding-top: 16px;
            border-top: 2px solid #f1f5f9;
        }
        .rejection-box {
            background: #fef2f2;
            border: 1px solid #fca5a5;
            border-radius: 12px;
            padding: 16px;
            font-size: 14px;
            color: #991b1b;
            margin-top: 20px;
            line-height: 1.5;
        }
        .rejection-box strong {
            color: #7f1d1d;
        }
        .footer-text {
            text-align: center;
            padding: 24px 32px 32px;
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.6;
        }
        .footer-text a {
            color: #ef4444;
            text-decoration: underline;
        }
        .btn {
            display: inline-block;
            background: #ef4444;
            color: #ffffff;
            font-size: 14px;
            font-weight: 700;
            padding: 12px 28px;
            border-radius: 40px;
            text-decoration: none;
            margin: 16px 0 8px;
        }
        .info-note {
            background: #fff7ed;
            border-radius: 12px;
            padding: 16px;
            font-size: 13px;
            color: #9a3412;
            margin-top: 20px;
            line-height: 1.5;
        }
        @media (max-width: 480px) {
            .body { padding: 20px; }
            .header { padding: 28px 20px 24px; }
            .detail-table td:first-child { width: 100px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <h1>Bukti Pembayaran Perlu Diperbaiki</h1>
                <p>Maaf, bukti transfer yang Anda unggah tidak dapat divalidasi</p>
                <div class="badge">{{ $booking->booking_code }}</div>
            </div>

            <div class="body">
                <div class="greeting">Halo, {{ $booking->guest_name }}!</div>

                <p style="font-size:14px;color:#475569;margin:0 0 20px">
                    Kami telah memeriksa bukti pembayaran manual yang Anda kirimkan untuk pemesanan villa berikut:
                </p>

                <div class="section-title">Detail Pemesanan</div>
                <table class="detail-table">
                    <tr>
                        <td>Kode Booking</td>
                        <td style="font-family: monospace;">{{ $booking->booking_code }}</td>
                    </tr>
                    <tr>
                        <td>Villa</td>
                        <td style="font-weight: 700; color: #0f172a;">{{ $booking->villa->name }}</td>
                    </tr>
                    <tr>
                        <td>Check-in</td>
                        <td>{{ \Carbon\Carbon::parse($booking->check_in)->isoFormat('dddd, D MMMM YYYY') }}</td>
                    </tr>
                    <tr>
                        <td>Check-out</td>
                        <td>{{ \Carbon\Carbon::parse($booking->check_out)->isoFormat('dddd, D MMMM YYYY') }}</td>
                    </tr>
                    <tr>
                        <td>Total Pembayaran</td>
                        <td style="font-weight: 700; color: #ef4444;">Rp {{ number_format((float) $booking->total_amount, 0, ',', '.') }}</td>
                    </tr>
                </table>

                <div class="rejection-box">
                    <strong>Alasan Penolakan:</strong><br>
                    {{ $rejectionReason }}
                </div>

                <div class="info-note">
                    <strong>👉 Langkah selanjutnya:</strong> Silakan klik tombol di bawah untuk masuk ke halaman pembayaran aman kami, periksa kembali nomor rekening tujuan Anda, transfer jumlah yang sesuai, dan unggah ulang foto bukti transfer yang asli dan jelas.
                </div>

                <div style="text-align:center;margin-top:24px">
                    <a href="{{ config('app.url') }}/booking/payment?code={{ $booking->booking_code }}" class="btn">Kirim Ulang Bukti Bayar</a>
                </div>
            </div>
        </div>

        <div class="footer-text">
            <p style="margin:0 0 8px;font-weight:600;color:#1e293b">PusatVilla.id</p>
            <p style="margin:0 0 4px">Platform persewaan villa premium terbaik di Indonesia</p>
            <p style="margin:0">
                <a href="mailto:support@pusatvilla.id">support@pusatvilla.id</a>
            </p>
            <p style="margin:8px 0 0;font-size:12px;color:#cbd5e1">
                © {{ date('Y') }} External. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
