<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Baru Masuk</title>
    <style>
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
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
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
            border: 1px solid #f1f5f9;
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a, #0f172a);
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
            color: #93c5fd;
            font-size: 14px;
            margin: 0;
        }
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            padding: 4px 14px;
            border-radius: 20px;
            margin-top: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .body {
            padding: 32px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #0f172a;
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
            width: 140px;
        }
        .detail-table td:last-child {
            font-weight: 600;
            color: #1e293b;
        }
        .price-row td {
            padding-top: 16px;
            border-bottom: none;
        }
        .price-row td:last-child {
            font-size: 18px;
            font-weight: 700;
            color: #3b82f6;
        }
        .villa-name {
            font-weight: 700;
            color: #0f172a;
        }
        .status-badge {
            display: inline-block;
            background: #fef3c7;
            color: #d97706;
            font-size: 12px;
            font-weight: 700;
            padding: 3px 12px;
            border-radius: 20px;
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
        .footer-text {
            text-align: center;
            padding: 24px 32px 32px;
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.6;
        }
        .footer-text a {
            color: #3b82f6;
            text-decoration: none;
        }
        .btn {
            display: inline-block;
            background: #3b82f6;
            color: #ffffff !important;
            font-size: 14px;
            font-weight: 700;
            padding: 12px 28px;
            border-radius: 40px;
            text-decoration: none;
            margin: 16px 0 8px;
            text-align: center;
        }
        .btn-wa {
            display: inline-block;
            background: #22c55e;
            color: #ffffff !important;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 4px;
        }
        .notes-box {
            background: #f8fafc;
            border-radius: 12px;
            padding: 16px;
            font-size: 13px;
            color: #475569;
            margin-top: 12px;
            line-height: 1.5;
            border: 1px dashed #cbd5e1;
        }
        @media (max-width: 480px) {
            .body { padding: 20px; }
            .header { padding: 28px 20px 24px; }
            .detail-table td:first-child { width: 110px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <h1>Booking Baru Masuk!</h1>
                <p>Reservasi baru telah dibuat di sistem</p>
                <div class="badge">{{ $booking->booking_code }}</div>
            </div>

            <div class="body">
                <div class="greeting">Halo Admin,</div>
                <p style="font-size:14px;color:#475569;margin:0 0 20px">
                    Sistem telah menerima reservasi baru. Segera periksa detail reservasi di bawah ini untuk persiapan atau verifikasi pembayaran:
                </p>

                <div class="section-title">Detail Reservasi</div>
                <table class="detail-table">
                    <tr>
                        <td>Kode Booking</td>
                        <td style="font-family: monospace;">{{ $booking->booking_code }}</td>
                    </tr>
                    <tr>
                        <td>Villa</td>
                        <td class="villa-name">{{ $booking->villa->name }}</td>
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
                        <td>Durasi</td>
                        <td>{{ $booking->total_nights }} malam</td>
                    </tr>
                    <tr>
                        <td>Tamu</td>
                        <td>{{ $booking->num_guests }} orang</td>
                    </tr>
                    <tr>
                        <td>Status Booking</td>
                        <td><span class="status-badge">{{ ucfirst($booking->status) }}</span></td>
                    </tr>
                    <tr class="price-row">
                        <td>Total Pembayaran</td>
                        <td>Rp {{ number_format((float) $booking->total_amount, 0, ',', '.') }}</td>
                    </tr>
                </table>

                <div class="section-title">Detail Pelanggan</div>
                <table class="detail-table">
                    <tr>
                        <td>Nama Lengkap</td>
                        <td>{{ $booking->guest_name }}</td>
                    </tr>
                    <tr>
                        <td>Email</td>
                        <td><a href="mailto:{{ $booking->guest_email }}" style="color: #3b82f6; text-decoration: none;">{{ $booking->guest_email }}</a></td>
                    </tr>
                    <tr>
                        <td>No. Handphone</td>
                        <td>
                            {{ $booking->guest_phone }}
                            @php
                                $whatsappPhone = preg_replace('/[^0-9]/', '', $booking->guest_phone);
                                if (str_starts_with($whatsappPhone, '0')) {
                                    $whatsappPhone = '62' . substr($whatsappPhone, 1);
                                }
                            @endphp
                            <br/>
                            <a href="https://wa.me/{{ $whatsappPhone }}" target="_blank" class="btn-wa">
                                💬 Hubungi via WhatsApp
                            </a>
                        </td>
                    </tr>
                </table>

                @if(!empty($booking->notes))
                <div class="section-title">Catatan Tambahan</div>
                <div class="notes-box">
                    {!! nl2br(e($booking->notes)) !!}
                </div>
                @endif

                @if(!empty($booking->utm_source) || !empty($booking->utm_medium) || !empty($booking->utm_campaign))
                <div class="section-title">Informasi UTM (Marketing)</div>
                <table class="detail-table">
                    @if(!empty($booking->utm_source))
                    <tr>
                        <td>UTM Source</td>
                        <td>{{ $booking->utm_source }}</td>
                    </tr>
                    @endif
                    @if(!empty($booking->utm_medium))
                    <tr>
                        <td>UTM Medium</td>
                        <td>{{ $booking->utm_medium }}</td>
                    </tr>
                    @endif
                    @if(!empty($booking->utm_campaign))
                    <tr>
                        <td>UTM Campaign</td>
                        <td>{{ $booking->utm_campaign }}</td>
                    </tr>
                    @endif
                </table>
                @endif

                <div style="text-align:center;margin-top:28px">
                    <a href="{{ config('app.frontend_url') }}/admin/bookings/detail?id={{ $booking->id }}" class="btn">
                        Buka Halaman Admin Booking
                    </a>
                </div>
            </div>
        </div>

        <div class="footer-text">
            <p style="margin:0 0 8px;font-weight:600;color:#1e293b">PusatVilla.id</p>
            <p style="margin:0 0 4px">Notifikasi Sistem Otomatis - PusatVilla.id</p>
            <p style="margin:8px 0 0;font-size:12px;color:#cbd5e1">
                © {{ date('Y') }} PusatVilla.id. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
