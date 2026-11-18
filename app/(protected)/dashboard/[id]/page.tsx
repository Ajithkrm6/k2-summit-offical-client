"use client";
import { FirmDetailedPage } from "@/modules/crm/components/FirmDetailedPage";
import { useParams } from "next/navigation";

export default function FirmById() {
  const params = useParams();

  const id = params.id;
  const firmId = typeof id === "string" ? id : "";

  return <FirmDetailedPage firmId={firmId} />;
}
