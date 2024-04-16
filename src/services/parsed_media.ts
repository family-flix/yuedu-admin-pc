import { FetchParams } from "@/domains/list/typing";
import { TmpRequestResp, request } from "@/domains/request/utils";
import { ListResponseWithCursor, RequestedResource, Result, UnpackedResult } from "@/types/index";

/**
 * 获取搜索到的小说列表
 */
export function fetchSearchedNovelList(params: FetchParams & { keyword: string }) {
  const { page, pageSize, keyword, ...rest } = params;
  return request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      url: string;
      profile: {
        name: string;
        overview: string;
        cover_path: string;
      };
      source: {
        hostname: string;
        name: string;
      };
    }>
  >(`/api/v1/searched_novel/list`, {
    ...rest,
    name: keyword,
    page,
    page_size: pageSize,
  });
}
export type SearchedNovelItem = UnpackedResult<TmpRequestResp<typeof fetchSearchedNovelList>>["list"][0];
export function fetchSearchedNovelListProcess(r: TmpRequestResp<typeof fetchSearchedNovelList>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((novel) => {
      const { id, name, url, profile, source } = novel;
      return {
        id,
        name,
        url: (() => {
          if (url.startsWith("http")) {
            return url;
          }
          return source.hostname + url;
        })(),
        profile,
        source,
      };
    }),
  });
}

/**
 * 获取搜索到的小说详情、包含章节
 */
export function fetchSearchedNovelProfile(value: { id: string }) {
  const { id } = value;
  return request.post<{
    id: string;
    name: string;
    profile: {
      name: string;
      overview: string;
      cover_path: string;
    };
    source: {
      name: string;
    };
    chapter: {
      list: {
        id: string;
        name: string;
        url: string;
        profile: {
          name: string;
          novel_name: string;
        };
      }[];
      next_marker: string;
    };
  }>(`/api/v1/searched_novel/profile`, {
    searched_novel_id: id,
  });
}

export function fetchSearchedNovelProfileProcess(r: TmpRequestResp<typeof fetchSearchedNovelProfile>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const data = r.data;
  return Result.Ok({
    ...data,
    chapter: {
      ...data.chapter,
      list: data.chapter.list.map((chapter) => {
        const { id, name, url, profile } = chapter;
        return {
          id,
          name,
          url,
          searched_novel: {
            name: data.name,
            source_name: data.source.name,
          },
          profile,
        };
      }),
    },
  });
}

export function fetchSearchedChapterList(params: FetchParams & { novel_id: string; name: string }) {
  const { novel_id, name, page, pageSize, ...rest } = params;
  return request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      url: string;
      searched_novel: {
        name: string;
        source_name: string;
      };
      profile?: {
        name: string;
        novel_name: string;
      };
    }>
  >(`/api/v1/searched_chapter/list`, {
    ...rest,
    searched_novel_id: novel_id,
    name,
    page,
    page_size: pageSize,
  });
}
export function fetchSearchedChapterListProcess(r: TmpRequestResp<typeof fetchSearchedChapterList>) {
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, url, searched_novel, profile } = tv;
      return {
        id,
        name,
        url,
        searched_novel,
        profile,
      };
    }),
  });
}
export type SearchedChapterItem = RequestedResource<typeof fetchSearchedChapterListProcess>["list"][0];

export function fetchSearchedNovelChapterContent(value: { searched_chapter_id: string }) {
  const { searched_chapter_id } = value;
  return request.post<{
    content: string;
  }>("/api/v1/searched_chapter/content", {
    searched_chapter_id,
  });
}

/** 设置未解析的影视剧详情 */
export function setSearchedChapterProfile(body: {
  searched_chapter_id: string;
  novel_profile: { id: string; name: string };
  chapter_profile: { id: string; name: string };
}) {
  const { searched_chapter_id, chapter_profile } = body;
  return request.post<void>("/api/v1/searched_chapter/set_profile", {
    searched_chapter_id,
    chapter_profile,
  });
}

/** 删除搜索到的小说章节 */
export function deleteSearchedNovelChapter(value: { searched_chapter_id: string }) {
  const { searched_chapter_id } = value;
  return request.post("/api/v1/searched_novel/chapter/delete", { searched_chapter_id });
}

/** 删除搜索到的小说章节 */
export function refreshSearchedNovelChapter(value: { searched_chapter_id: string }) {
  const { searched_chapter_id } = value;
  return request.post("/api/v1/searched_novel/chapter/delete", { searched_chapter_id });
}

export function fetchSourcePreviewInfo(values: { searched_chapter_id: string }) {
  const { searched_chapter_id } = values;
  return request.post("/api/v1/searched_chapter/content", { searched_chapter_id });
}
