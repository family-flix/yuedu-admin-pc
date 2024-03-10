import { request } from "@/domains/request_v2/utils";

export function exportNovelData() {
  return request.post("/api/v1/novel_data/export");
}
export function importNovelData() {
  return request.post("/api/v1/novel_data/import");
}
