-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see only their own generated content
CREATE POLICY "Users can view their own data"
ON generated_content
FOR SELECT
USING (auth.uid()::text = user_id::text); -- Casting keys if needed, assuming user_id matches auth.uid

-- Policy: Users can insert their own content
CREATE POLICY "Users can insert their own content"
ON generated_content
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Admins can see everything
-- Note: This requires a way to check admin status from the auth.jwt() claim or a separate admin table lookup
-- If keeping it simple via app-level logic, RLS might just enforce "user owns data" 
-- and the backend uses a service_role key for admin tasks.
-- However, if using Supabase Client directly (frontend):

CREATE POLICY "Admins can access all data"
ON generated_content
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::int -- Adjust casting based on your ID type (UUID vs Int)
    AND users.is_admin = TRUE
  )
);
