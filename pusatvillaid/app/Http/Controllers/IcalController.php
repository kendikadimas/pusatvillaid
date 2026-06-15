<?php

namespace App\Http\Controllers;

use App\Models\Villa;
use Carbon\Carbon;
use Illuminate\Http\Response;

class IcalController extends Controller
{
    /**
     * Generate iCal (.ics) feed for a villa's booked and blocked dates.
     *
     * External OTAs (Agoda, Traveloka, Airbnb, Booking.com) can subscribe
     * to this URL to auto-sync availability from PusatVilla.id.
     */
    public function export(int $id): Response
    {
        $villa = Villa::find($id);

        if (! $villa) {
            abort(404, 'Villa not found.');
        }

        $events = [];

        // 1. Get all active bookings (confirmed, pending, completed)
        $bookings = $villa->bookings()
            ->where('status', '!=', 'cancelled')
            ->where('check_out', '>=', now()->toDateString())
            ->get(['booking_code', 'check_in', 'check_out', 'status', 'guest_name', 'created_at']);

        foreach ($bookings as $booking) {
            $events[] = [
                'uid' => $booking->booking_code.'@pusatvilla.id',
                'dtstart' => Carbon::parse($booking->check_in)->format('Ymd'),
                'dtend' => Carbon::parse($booking->check_out)->format('Ymd'),
                'summary' => 'Reserved - '.$booking->booking_code,
                'description' => "Status: {$booking->status}",
                'created' => Carbon::parse($booking->created_at)->format('Ymd\THis\Z'),
            ];
        }

        // 2. Get blocked dates and group consecutive dates into ranges
        $blockedDates = $villa->blockedDates()
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->get(['date', 'reason', 'created_at']);

        if ($blockedDates->isNotEmpty()) {
            // Group consecutive blocked dates into event ranges
            $ranges = [];
            $currentRange = null;

            foreach ($blockedDates as $blocked) {
                $date = Carbon::parse($blocked->date);

                if ($currentRange === null) {
                    $currentRange = [
                        'start' => $date,
                        'end' => $date->copy()->addDay(),
                        'reason' => $blocked->reason ?? 'Blocked',
                        'created' => $blocked->created_at,
                    ];
                } elseif ($date->equalTo($currentRange['end'])) {
                    // Consecutive date — extend range
                    $currentRange['end'] = $date->copy()->addDay();
                } else {
                    // Gap — save current range and start new one
                    $ranges[] = $currentRange;
                    $currentRange = [
                        'start' => $date,
                        'end' => $date->copy()->addDay(),
                        'reason' => $blocked->reason ?? 'Blocked',
                        'created' => $blocked->created_at,
                    ];
                }
            }

            if ($currentRange) {
                $ranges[] = $currentRange;
            }

            foreach ($ranges as $i => $range) {
                $events[] = [
                    'uid' => "blocked-{$villa->id}-{$i}-".$range['start']->format('Ymd').'@pusatvilla.id',
                    'dtstart' => $range['start']->format('Ymd'),
                    'dtend' => $range['end']->format('Ymd'),
                    'summary' => 'Blocked - '.($range['reason'] ?? 'Maintenance'),
                    'description' => $range['reason'] ?? 'Maintenance',
                    'created' => Carbon::parse($range['created'])->format('Ymd\THis\Z'),
                ];
            }
        }

        // 3. Build iCal output
        $ical = "BEGIN:VCALENDAR\r\n";
        $ical .= "VERSION:2.0\r\n";
        $ical .= "PRODID:-//PusatVilla.id//Booking Calendar//ID\r\n";
        $ical .= "CALSCALE:GREGORIAN\r\n";
        $ical .= "METHOD:PUBLISH\r\n";
        $ical .= 'X-WR-CALNAME:'.$this->escapeIcal($villa->name)." - PusatVilla.id\r\n";
        $ical .= "X-WR-TIMEZONE:Asia/Jakarta\r\n";

        foreach ($events as $event) {
            $ical .= "BEGIN:VEVENT\r\n";
            $ical .= 'UID:'.$event['uid']."\r\n";
            $ical .= 'DTSTART;VALUE=DATE:'.$event['dtstart']."\r\n";
            $ical .= 'DTEND;VALUE=DATE:'.$event['dtend']."\r\n";
            $ical .= 'SUMMARY:'.$this->escapeIcal($event['summary'])."\r\n";
            $ical .= 'DESCRIPTION:'.$this->escapeIcal($event['description'])."\r\n";
            $ical .= 'DTSTAMP:'.$event['created']."\r\n";
            $ical .= "STATUS:CONFIRMED\r\n";
            $ical .= "TRANSP:OPAQUE\r\n";
            $ical .= "END:VEVENT\r\n";
        }

        $ical .= "END:VCALENDAR\r\n";

        return response($ical, 200)
            ->header('Content-Type', 'text/calendar; charset=utf-8')
            ->header('Content-Disposition', 'inline; filename="'.$villa->slug.'.ics"');
    }

    /**
     * Escape special characters for iCal text fields.
     */
    private function escapeIcal(string $text): string
    {
        $text = str_replace('\\', '\\\\', $text);
        $text = str_replace(',', '\\,', $text);
        $text = str_replace(';', '\\;', $text);
        $text = str_replace("\n", '\\n', $text);

        return $text;
    }
}
