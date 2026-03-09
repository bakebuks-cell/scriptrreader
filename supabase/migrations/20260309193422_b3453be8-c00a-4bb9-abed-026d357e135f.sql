CREATE POLICY "Users can update own trades"
ON public.trades
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());