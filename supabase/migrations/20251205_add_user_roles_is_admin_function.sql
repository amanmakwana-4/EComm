-- Idempotent migration: add SECURITY DEFINER is_admin(user_uuid) function
-- and non-recursive admin policy for public.user_roles
-- Run in Supabase SQL editor or via migrations runner

BEGIN;

-- Create or replace the SECURITY DEFINER helper function that checks admin membership
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = user_uuid AND ur.role = 'admin'
  );
$$;

-- Grant execute so policies can call the function
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO PUBLIC;

-- Replace owner SELECT policy with a type-safe comparison
DROP POLICY IF EXISTS user_roles_select_owner ON public.user_roles;
CREATE POLICY user_roles_select_owner
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid()::uuid);

-- Replace admin management policy to call the SECURITY DEFINER function
DROP POLICY IF EXISTS user_roles_admin_manage ON public.user_roles;
CREATE POLICY user_roles_admin_manage
  ON public.user_roles
  FOR ALL
  USING (public.is_admin(auth.uid()::uuid));

-- Ensure RLS is enabled for the table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

COMMIT;
