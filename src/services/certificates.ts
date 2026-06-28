import { supabase } from "@/lib/supabase";

export type VerifiedCertificate = {
  certificate_id: string;
  student_name: string;
  course_title: string;
  issued_at: string;
};

export async function verifyCertificate(
  certificateId: string,
): Promise<VerifiedCertificate | null> {
  const { data, error } = await supabase.rpc("verify_certificate", {
    p_certificate_id: certificateId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) return null;

  return row as VerifiedCertificate;
}
