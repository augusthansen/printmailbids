-- Allow users to insert their own profile
-- This is needed because the client-side signup also tries to create/update the profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
