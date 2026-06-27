<?php

use App\Models\Villa;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing photos data
        Villa::chunk(100, function ($villas) {
            foreach ($villas as $villa) {
                $photos = $villa->photos;
                if (! is_array($photos)) {
                    continue;
                }

                $updatedPhotos = [];
                $changed = false;

                foreach ($photos as $photo) {
                    if (is_string($photo)) {
                        $updatedPhotos[] = [
                            'url' => $photo,
                            'description' => '',
                            'category' => 'Lainnya',
                        ];
                        $changed = true;
                    } elseif (is_array($photo)) {
                        $updatedPhoto = $photo;
                        if (! isset($photo['category'])) {
                            $updatedPhoto['category'] = 'Lainnya';
                            $changed = true;
                        }
                        if (! isset($photo['description'])) {
                            $updatedPhoto['description'] = '';
                            $changed = true;
                        }
                        $updatedPhotos[] = $updatedPhoto;
                    } else {
                        $updatedPhotos[] = $photo;
                    }
                }

                if ($changed) {
                    $villa->photos = $updatedPhotos;
                    $villa->save();
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optional down logic
    }
};
