import { request } from "@/domains/request/utils";

export function exportNovelData() {
  return request.post("/api/v1/novel_data/export");
}
export function importNovelData(file: File) {
  const body = new FormData();
  body.append("file", file);
  return request.post("/api/v1/novel_data/import", body);
}
