/**
 * @file 电视剧详情
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { AlertCircle, ArrowLeft, CheckCircle, Edit, Play, Trash } from "lucide-solid";

import { MediaSourceItem } from "@/services/media";
import {
  UnknownEpisodeItem,
  deleteParsedMediaSource,
  fetchSearchedChapterList,
  fetchSearchedNovelProfile,
  setSearchedChapterProfile,
} from "@/services/parsed_media";
import { EpisodeItemInSeason, deleteSeason, SeasonInTVProfile, refreshSeasonProfile } from "@/services";
import { ScrollView, Skeleton, Dialog, LazyImage, ListView, Input } from "@/components/ui";
import { NovelProfileSearchView } from "@/components/TMDBSearcher";
import { MenuItemCore, ContextMenuCore, ScrollViewCore, DialogCore, ButtonCore, ImageCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { NovelProfileSearchCore } from "@/domains/tmdb";
import { ListCore } from "@/domains/list";
import { appendAction } from "@/store/actions";
import { createJob } from "@/store/job";
import { ViewComponent } from "@/store/types";
import { RequestedResource } from "@/types";
import { NovelSearchCore } from "@/domains/media_search";

export const SearchedNovelProfilePage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const profileRequest = new RequestCore(fetchSearchedNovelProfile, {
    onSuccess(v) {
      poster.setURL(v.profile.cover_path);
      const { chapter } = v;
      chapterList.modifyResponse((prev) => {
        return {
          ...prev,
          dataSource: chapter.list,
        };
      });
      chapterList.setParams((prev) => {
        return {
          ...prev,
          next_marker: chapter.next_marker,
        };
      });
      setProfile(v);
    },
    onFailed(error) {
      app.tip({ text: ["获取电视剧详情失败", error.message] });
    },
  });
  const sourceDeletingRequest = new RequestCore(deleteParsedMediaSource, {
    // onLoading(loading) {
    //   fileDeletingConfirmDialog.okBtn.setLoading(loading);
    // },
    onSuccess() {
      const theEpisode = episodeRef.value;
      const theSource = fileRef.value;
      if (!theEpisode || !theSource) {
        app.tip({
          text: ["删除成功，请刷新页面"],
        });
        return;
      }
      //       setProfile((prev) => {
      //         if (prev === null) {
      //           return null;
      //         }
      //         const { episodes, ...rest } = prev;
      //         return {
      //           ...rest,
      //           episodes: episodes.map((episode) => {
      //             if (episode.id !== theEpisode.id) {
      //               return episode;
      //             }
      //             return {
      //               ...episode,
      //               sources: episode.sources.filter((source) => {
      //                 if (source.id !== theSource.id) {
      //                   return true;
      //                 }
      //                 return false;
      //               }),
      //             };
      //           }),
      //         };
      //       });
      // fileDeletingConfirmDialog.hide();
      app.tip({
        text: ["删除成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["删除视频源失败", error.message],
      });
    },
  });
  const setMediaSourceProfileRequest = new RequestCore(setSearchedChapterProfile, {
    onLoading(loading) {
      setChapterProfileDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["修改失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      setChapterProfileDialog.hide();
    },
  });
  const chapterList = new ListCore(new RequestCore(fetchSearchedChapterList), {
    search: {
      novel_id: view.query.id,
    },
  });
  const curEpisode = new RefCore<UnknownEpisodeItem>();
  const mediaSearch = new NovelSearchCore();
  const setChapterProfileDialog = new DialogCore({
    onOk() {
      if (!curEpisode.value) {
        app.tip({ text: ["请先选择设置的章节"] });
        return;
      }
      const mediaProfile = mediaSearch.curNovel;
      const sourceProfile = mediaSearch.curChapter;
      if (!mediaProfile) {
        app.tip({ text: ["请先选择小说"] });
        return;
      }
      if (!sourceProfile) {
        app.tip({ text: ["请先选择章节"] });
        return;
      }
      const { id } = curEpisode.value;
      setMediaSourceProfileRequest.run({
        searched_chapter_id: id,
        novel_profile: {
          id: String(mediaProfile.id),
          name: mediaProfile.name,
        },
        chapter_profile: {
          id: String(sourceProfile.id),
          name: sourceProfile.name,
        },
      });
    },
  });
  const seasonDeletingRequest = new RequestCore(deleteSeason, {
    onLoading(loading) {
      seasonDeletingConfirmDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
    onSuccess() {
      app.tip({
        text: ["删除成功"],
      });
      appendAction("deleteTV", {
        tv_id: view.query.id,
        id: view.query.season_id,
      });
      seasonDeletingConfirmDialog.hide();
      history.back();
    },
  });
  const seasonProfileRefreshRequest = new RequestCore(refreshSeasonProfile, {
    onSuccess(r) {
      createJob({
        job_id: r.job_id,
        onFinish() {
          app.tip({ text: ["刷新详情成功"] });
          profileRequest.reload();
          profileRefreshBtn.setLoading(false);
        },
      });
    },
    onFailed(error) {
      app.tip({
        text: ["刷新详情失败", error.message],
      });
      profileRefreshBtn.setLoading(false);
    },
  });
  const tmpSeasonRef = new RefCore<SeasonInTVProfile>();
  const seasonRef = new RefCore<SeasonInTVProfile>();
  const episodeRef = new RefCore<MediaSourceItem>();
  const fileRef = new RefCore<EpisodeItemInSeason["sources"][number]>();
  // const curParsedTV = new SelectionCore<TVProfile["parsed_tvs"][number]>();
  const searcher = new NovelProfileSearchCore();
  const dialog = new DialogCore({
    onOk() {
      const id = view.query.id as string;
      if (!id) {
        app.tip({ text: ["更新详情失败", "缺少电视剧 id"] });
        return;
      }
      const media = searcher.cur;
      if (!media) {
        app.tip({ text: ["请先选择详情"] });
        return;
      }
      dialog.okBtn.setLoading(true);
      // seasonProfileChangeRequest.run({
      //   media_id: id,
      //   media_profile: {
      //     id: String(media.id),
      //     type: media.type,
      //     name: media.name,
      //   },
      // });
    },
  });
  const profileChangeBtn = new ButtonCore({
    onClick() {
      if (profileRequest.response) {
        searcher.$input.setValue(profileRequest.response.name);
      }
      dialog.show();
    },
  });
  const profileRefreshBtn = new ButtonCore({
    onClick() {
      app.tip({
        text: ["开始刷新"],
      });
      profileRefreshBtn.setLoading(true);
      seasonProfileRefreshRequest.run({ season_id: view.query.season_id });
    },
  });
  const seasonDeletingBtn = new ButtonCore({
    onClick() {
      // if (profileRequest.response) {
      //   seasonRef.select(profileRequest.response.curSeason);
      // }
      // seasonDeletingConfirmDialog.show();
    },
  });
  const seasonDeletingConfirmDialog = new DialogCore({
    title: "删除季",
    onOk() {
      if (!seasonRef.value) {
        app.tip({
          text: ["请先选择要删除的季"],
        });
        return;
      }
      seasonDeletingRequest.run({
        season_id: seasonRef.value.id,
      });
    },
  });
  const deleteSeasonMenuItem = new MenuItemCore({
    label: "删除",
    async onClick() {
      seasonDeletingConfirmDialog.show();
      seasonContextMenu.hide();
    },
  });
  const fileDeletingConfirmDialog = new DialogCore({
    title: "删除视频源",
    onOk() {
      const theSource = fileRef.value;
      if (!theSource) {
        app.tip({
          text: ["请先选择要删除的源"],
        });
        return;
      }
      sourceDeletingRequest.run({
        parsed_media_source_id: theSource.id,
      });
    },
  });
  const seasonContextMenu = new ContextMenuCore({
    items: [deleteSeasonMenuItem],
  });
  const poster = new ImageCore({});
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      chapterList.loadMore();
    },
  });

  const [profile, setProfile] = createSignal<RequestedResource<typeof fetchSearchedNovelProfile> | null>(null);
  const [chapterResponse, setChapterResponse] = createSignal(chapterList.response);
  const [curSeason, setCurSeason] = createSignal(seasonRef.value);

  chapterList.onStateChange((v) => {
    console.log("setChapterResponse", v.search);
    setChapterResponse(v);
  });

  onMount(() => {
    profileRequest.run({ id: view.query.id });
  });

  return (
    <>
      <ScrollView class="h-screen py-4 px-8" store={scrollView}>
        <div class="py-2">
          <div
            class="mb-2 cursor-pointer"
            onClick={() => {
              history.back();
            }}
          >
            <ArrowLeft class="w-6 h-6" />
          </div>
          <Show
            when={!!profile()}
            fallback={
              <div class="relative">
                <div class="">
                  <div>
                    <div class="relative z-3">
                      <div class="flex">
                        <Skeleton class="w-[240px] h-[360px] rounded-lg mr-4 object-cover" />
                        <div class="flex-1 mt-4">
                          <Skeleton class="w-full h-[48px]"></Skeleton>
                          <Skeleton class="mt-6 w-12 h-[36px]"></Skeleton>
                          <div class="mt-2 space-y-1">
                            <Skeleton class="w-12 h-[18px]"></Skeleton>
                            <Skeleton class="w-full h-[18px]"></Skeleton>
                            <Skeleton class="w-32 h-[18px]"></Skeleton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <div class="relative">
              <div class="">
                <div>
                  <div class="relative z-3">
                    <div class="flex">
                      <LazyImage
                        class="overflow-hidden w-[240px] h-[360px] rounded-lg mr-4 object-cover"
                        store={poster}
                        // src={profile()?.poster_path ?? undefined}
                      />
                      <div class="flex-1 mt-4">
                        <h2 class="text-5xl">{profile()?.name}</h2>
                        <div class="mt-6 text-2xl">剧情简介</div>
                        {/* <div class="mt-2">{profile()?.overview}</div> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Show>
          <div class="relative z-3 mt-4">
            <div class="space-y-4 mt-8">
              <For each={chapterResponse().dataSource}>
                {(chapter) => {
                  const { id, name, profile } = chapter;
                  return (
                    <div title={id}>
                      <div class="flex items-center space-x-2">
                        <div class="text-lg">{name}</div>
                        <div
                          class="cursor-pointer"
                          onClick={() => {
                            curEpisode.select(chapter);
                            setChapterProfileDialog.show();
                          }}
                        >
                          <Edit class="w-4 h-4" />
                        </div>
                      </div>
                      <div class="pl-4 space-y-1">
                        <Show
                          when={profile}
                          fallback={
                            <div class="flex items-center space-x-2 text-sm">
                              <div>
                                <AlertCircle class="w-4 h-4 text-red-500" />
                              </div>
                              <div>未匹配到章节详情</div>
                            </div>
                          }
                        >
                          <div class="flex items-center space-x-2 text-sm">
                            <div>
                              <CheckCircle class="w-4 h-4 text-green-500" />
                            </div>
                            <div>
                              {profile?.novel_name}/{profile?.name}
                            </div>
                          </div>
                        </Show>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </ScrollView>
      <Dialog store={setChapterProfileDialog}>
        <div class="w-[520px]">
          <NovelProfileSearchView store={mediaSearch} />
        </div>
      </Dialog>
      <Dialog title="设置章节详情" store={dialog}>
        <div class="w-[520px]">{/* <NovelProfileSearchView store={searcher} /> */}</div>
      </Dialog>
    </>
  );
};
