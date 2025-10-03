drop extension if exists "pg_net";

revoke delete on table "public"."api_access_control" from "anon";

revoke insert on table "public"."api_access_control" from "anon";

revoke references on table "public"."api_access_control" from "anon";

revoke select on table "public"."api_access_control" from "anon";

revoke trigger on table "public"."api_access_control" from "anon";

revoke truncate on table "public"."api_access_control" from "anon";

revoke update on table "public"."api_access_control" from "anon";

revoke delete on table "public"."api_access_control" from "authenticated";

revoke insert on table "public"."api_access_control" from "authenticated";

revoke references on table "public"."api_access_control" from "authenticated";

revoke select on table "public"."api_access_control" from "authenticated";

revoke trigger on table "public"."api_access_control" from "authenticated";

revoke truncate on table "public"."api_access_control" from "authenticated";

revoke update on table "public"."api_access_control" from "authenticated";

revoke delete on table "public"."api_access_control" from "service_role";

revoke insert on table "public"."api_access_control" from "service_role";

revoke references on table "public"."api_access_control" from "service_role";

revoke select on table "public"."api_access_control" from "service_role";

revoke trigger on table "public"."api_access_control" from "service_role";

revoke truncate on table "public"."api_access_control" from "service_role";

revoke update on table "public"."api_access_control" from "service_role";

revoke delete on table "public"."audit_logs" from "anon";

revoke insert on table "public"."audit_logs" from "anon";

revoke references on table "public"."audit_logs" from "anon";

revoke select on table "public"."audit_logs" from "anon";

revoke trigger on table "public"."audit_logs" from "anon";

revoke truncate on table "public"."audit_logs" from "anon";

revoke update on table "public"."audit_logs" from "anon";

revoke delete on table "public"."audit_logs" from "authenticated";

revoke insert on table "public"."audit_logs" from "authenticated";

revoke references on table "public"."audit_logs" from "authenticated";

revoke select on table "public"."audit_logs" from "authenticated";

revoke trigger on table "public"."audit_logs" from "authenticated";

revoke truncate on table "public"."audit_logs" from "authenticated";

revoke update on table "public"."audit_logs" from "authenticated";

revoke delete on table "public"."audit_logs" from "service_role";

revoke insert on table "public"."audit_logs" from "service_role";

revoke references on table "public"."audit_logs" from "service_role";

revoke select on table "public"."audit_logs" from "service_role";

revoke trigger on table "public"."audit_logs" from "service_role";

revoke truncate on table "public"."audit_logs" from "service_role";

revoke update on table "public"."audit_logs" from "service_role";

revoke delete on table "public"."organizations" from "anon";

revoke insert on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "anon";

revoke select on table "public"."organizations" from "anon";

revoke trigger on table "public"."organizations" from "anon";

revoke truncate on table "public"."organizations" from "anon";

revoke update on table "public"."organizations" from "anon";

revoke delete on table "public"."organizations" from "authenticated";

revoke insert on table "public"."organizations" from "authenticated";

revoke references on table "public"."organizations" from "authenticated";

revoke select on table "public"."organizations" from "authenticated";

revoke trigger on table "public"."organizations" from "authenticated";

revoke truncate on table "public"."organizations" from "authenticated";

revoke update on table "public"."organizations" from "authenticated";

revoke delete on table "public"."organizations" from "service_role";

revoke insert on table "public"."organizations" from "service_role";

revoke references on table "public"."organizations" from "service_role";

revoke select on table "public"."organizations" from "service_role";

revoke trigger on table "public"."organizations" from "service_role";

revoke truncate on table "public"."organizations" from "service_role";

revoke update on table "public"."organizations" from "service_role";

revoke delete on table "public"."permissions" from "anon";

revoke insert on table "public"."permissions" from "anon";

revoke references on table "public"."permissions" from "anon";

revoke select on table "public"."permissions" from "anon";

revoke trigger on table "public"."permissions" from "anon";

revoke truncate on table "public"."permissions" from "anon";

revoke update on table "public"."permissions" from "anon";

revoke delete on table "public"."permissions" from "authenticated";

revoke insert on table "public"."permissions" from "authenticated";

revoke references on table "public"."permissions" from "authenticated";

revoke select on table "public"."permissions" from "authenticated";

revoke trigger on table "public"."permissions" from "authenticated";

revoke truncate on table "public"."permissions" from "authenticated";

revoke update on table "public"."permissions" from "authenticated";

revoke delete on table "public"."permissions" from "service_role";

revoke insert on table "public"."permissions" from "service_role";

revoke references on table "public"."permissions" from "service_role";

revoke select on table "public"."permissions" from "service_role";

revoke trigger on table "public"."permissions" from "service_role";

revoke truncate on table "public"."permissions" from "service_role";

revoke update on table "public"."permissions" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."user_invitations" from "anon";

revoke insert on table "public"."user_invitations" from "anon";

revoke references on table "public"."user_invitations" from "anon";

revoke select on table "public"."user_invitations" from "anon";

revoke trigger on table "public"."user_invitations" from "anon";

revoke truncate on table "public"."user_invitations" from "anon";

revoke update on table "public"."user_invitations" from "anon";

revoke delete on table "public"."user_invitations" from "authenticated";

revoke insert on table "public"."user_invitations" from "authenticated";

revoke references on table "public"."user_invitations" from "authenticated";

revoke select on table "public"."user_invitations" from "authenticated";

revoke trigger on table "public"."user_invitations" from "authenticated";

revoke truncate on table "public"."user_invitations" from "authenticated";

revoke update on table "public"."user_invitations" from "authenticated";

revoke delete on table "public"."user_invitations" from "service_role";

revoke insert on table "public"."user_invitations" from "service_role";

revoke references on table "public"."user_invitations" from "service_role";

revoke select on table "public"."user_invitations" from "service_role";

revoke trigger on table "public"."user_invitations" from "service_role";

revoke truncate on table "public"."user_invitations" from "service_role";

revoke update on table "public"."user_invitations" from "service_role";

revoke delete on table "public"."user_roles" from "anon";

revoke insert on table "public"."user_roles" from "anon";

revoke references on table "public"."user_roles" from "anon";

revoke select on table "public"."user_roles" from "anon";

revoke trigger on table "public"."user_roles" from "anon";

revoke truncate on table "public"."user_roles" from "anon";

revoke update on table "public"."user_roles" from "anon";

revoke delete on table "public"."user_roles" from "authenticated";

revoke insert on table "public"."user_roles" from "authenticated";

revoke references on table "public"."user_roles" from "authenticated";

revoke select on table "public"."user_roles" from "authenticated";

revoke trigger on table "public"."user_roles" from "authenticated";

revoke truncate on table "public"."user_roles" from "authenticated";

revoke update on table "public"."user_roles" from "authenticated";

revoke delete on table "public"."user_roles" from "service_role";

revoke insert on table "public"."user_roles" from "service_role";

revoke references on table "public"."user_roles" from "service_role";

revoke select on table "public"."user_roles" from "service_role";

revoke trigger on table "public"."user_roles" from "service_role";

revoke truncate on table "public"."user_roles" from "service_role";

revoke update on table "public"."user_roles" from "service_role";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_organizations(user_id uuid)
 RETURNS TABLE(organization_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT user_roles.organization_id
    FROM user_roles
    WHERE user_roles.user_id = $1
    AND is_active = true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_org_admin(user_id uuid, org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = $1
        AND user_roles.organization_id = $2
        AND role_type IN ('system_admin', 'organization_admin')
        AND is_active = true
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_system_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = $1
        AND role_type = 'system_admin'
        AND is_active = true
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;


