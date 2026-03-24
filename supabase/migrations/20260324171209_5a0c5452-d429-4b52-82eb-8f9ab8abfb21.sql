
CREATE POLICY "Anyone can delete events" ON public.funnel_events FOR DELETE TO public USING (true);
CREATE POLICY "Anyone can delete leads" ON public.leads FOR DELETE TO public USING (true);
