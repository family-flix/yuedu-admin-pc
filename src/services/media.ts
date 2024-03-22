import { TmpRequestResp, UnpackedRequestPayload, request } from "@/domains/request/utils";
import { FetchParams } from "@/domains/list/typing";
import { ListResponseWithCursor, Result, UnpackedResult } from "@/types/index";

/** 获取小说列表列表 */
export function fetchNovelProfileList(params: FetchParams & Partial<{ name: string }>) {
  const { page, pageSize, ...rest } = params;
  return request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      overview: string;
      cover_path: string;
      air_date: string;
      vote_average: string;
      episode_count: number;
      cur_episode_count: number;
      author: {
        name: string;
      };
      // genres: { value: string; label: string }[];
      tips: string[];
    }>
  >("/api/v1/novel_profile/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
}
// export function fetchNovelProfileListProcess(r: TmpRequestResp<typeof fetchNovelProfileList>) {}
export type SeasonMediaItem = UnpackedRequestPayload<ReturnType<typeof fetchNovelProfileList>>["list"][number];

/** 获取小说章节列表 */
export function fetchNovelChapterProfileList(
  params: FetchParams & Partial<{ name: string; invalid_chapter?: number }>
) {
  const { name, invalid_chapter, page, pageSize, ...rest } = params;
  return request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      files: {
        id: string;
        name: string;
        source_name: string;
        novel_name: string;
      }[];
    }>
  >("/api/v1/novel_profile/chapter/list", {
    ...rest,
    name,
    invalid_chapter,
    page,
    page_size: pageSize,
  });
}
export type NovelChapterProfileItem = UnpackedResult<
  TmpRequestResp<typeof fetchNovelChapterProfileList>
>["list"][number];
/** 获取小说详情 */
export function fetchNovelProfile(body: { novel_id: string; invalid_chapter?: number }) {
  const { novel_id, invalid_chapter } = body;
  return request.post<{
    id: string;
    name: string;
    overview: string;
    cover_path: string;
    author: {
      name: string;
    };
    chapter: {
      list: {
        id: string;
        name: string;
        files: {
          id: string;
          name: string;
          source_name: string;
          novel_name: string;
        }[];
      }[];
      next_marker: string;
    };
  }>("/api/v1/novel_profile/profile", {
    novel_id,
    invalid_chapter,
  });
}
// export function fetchNovelProfileProcess(r: TmpRequestResp<typeof fetchNovelProfile>) {
//   if (r.error) {
//     return Result.Err(r.error);
//   }
//   const { id, name, overview, cover_path, author, chapter } = r.data;
//   return Result.Ok({
//     id,
//     name,
//     overview,
//     cover_path,
//     author,
//     chapter,
//   });
// }
// export type NovelProfile = RequestedResource<typeof fetchNovelProfile>;
export type NovelProfile = UnpackedResult<TmpRequestResp<typeof fetchNovelProfile>>;

/*
 * 获取电视剧部分详情
 */
export function fetchPartialSeasonMedia(params: { media_id: string }) {
  const { media_id } = params;
  return request.post<{
    id: string;
    name: string;
    overview: string;
    cover_path: string;
    air_date: string;
    vote_average: string;
    episode_count: number;
    cur_episode_count: number;
    author: {
      name: string;
    };
    genres: { value: string; label: string }[];
    tips: string[];
  }>(`/api/v1/novel_profile/partial`, {
    media_id,
  });
}

/** 刷新小说详情 */
export function refreshMediaProfile(body: { media_id: string }) {
  const { media_id } = body;
  return request.post<{ job_id: string }>("/api/v1/novel_profile/refresh_profile", {
    media_id,
  });
}

/** 给书源章节设置详情 */
export function setSearchedChapterToChapterProfile(value: { searched_chapter_id: string; chapter_id: string }) {
  return request.post("/api/v1/novel_profile/chapter/set_profile", value);
}
