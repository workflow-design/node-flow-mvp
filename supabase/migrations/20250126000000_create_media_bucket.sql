-- Create a storage bucket for images and videos (if not exists)
INSERT INTO storage.buckets (id, name)
VALUES ('media', 'media')
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies to allow public access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Anyone can upload media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Anyone can update their media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media');

CREATE POLICY "Anyone can delete media"
ON storage.objects FOR DELETE
USING (bucket_id = 'media');
