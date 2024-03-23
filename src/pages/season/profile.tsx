/**
 * @file 电视剧详情
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { ArrowLeft, Play, Trash } from "lucide-solid";

import { ViewComponent } from "@/store/types";
import { appendAction } from "@/store/actions";
import { createJob } from "@/store/job";
import {
  NovelChapterProfileItem,
  NovelProfile,
  fetchNovelChapterProfileList,
  fetchNovelProfile,
  setSearchedChapterToChapterProfile,
} from "@/services/media";
import { deleteSearchedNovelChapter } from "@/services/parsed_media";
import { fetchEpisodesOfSeason, deleteSeason, SeasonInTVProfile, refreshSeasonProfile } from "@/services";
import { Button, ContextMenu, ScrollView, Skeleton, Dialog, LazyImage, ListView, Input } from "@/components/ui";
import { SearchedChapterSelect, SearchedChapterSelectCore } from "@/components/searched-chapter-select";
import {
  MenuItemCore,
  ContextMenuCore,
  ScrollViewCore,
  DialogCore,
  ButtonCore,
  ImageCore,
  ImageInListCore,
  ButtonInListCore,
} from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { NovelProfileSearchCore } from "@/domains/tmdb";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ListCoreV2 } from "@/domains/list/v2";
import { cn } from "@/utils";

export const HomeSeasonProfilePage: ViewComponent = (props) => {
  const { app, client, history, view } = props;

  const chapterList = new ListCoreV2(
    new RequestCoreV2({
      fetch: fetchNovelChapterProfileList,
      client,
    }),
    {
      pageSize: 100,
    }
  );
  const profileRequest = new RequestCoreV2({
    fetch: fetchNovelProfile,
    client,
    onSuccess(v) {
      poster.setURL(v.poster_path);
      setProfile(v);
      setTimeout(() => {
        chapterList.setParams((prev) => {
          return {
            ...prev,
            next_marker: v.chapter.next_marker,
          };
        });
        chapterList.modifyResponse((prev) => {
          return {
            ...prev,
            search: {
              ...prev.search,
              novel_id: v.id,
            },
            dataSource: v.chapter.list,
          };
        });
      }, 800);
    },
    onFailed(error) {
      app.tip({ text: ["获取电视剧详情失败", error.message] });
    },
  });
  const sourceDeletingRequest = new RequestCoreV2({
    fetch: deleteSearchedNovelChapter,
    client,
    // onLoading(loading) {
    //   fileDeletingConfirmDialog.okBtn.setLoading(loading);
    // },
    onSuccess() {
      const theSource = fileRef.value;
      if (!theSource) {
        app.tip({
          text: ["删除成功，请刷新页面"],
        });
        return;
      }
      // setProfile((prev) => {
      //   if (prev === null) {
      //     return null;
      //   }
      //   const { episodes, ...rest } = prev;
      //   return {
      //     ...rest,
      //     episodes: episodes.map((episode) => {
      //       if (episode.id !== theEpisode.id) {
      //         return episode;
      //       }
      //       return {
      //         ...episode,
      //         sources: episode.sources.filter((source) => {
      //           if (source.id !== theSource.id) {
      //             return true;
      //           }
      //           return false;
      //         }),
      //       };
      //     }),
      //   };
      // });
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
  const searchedChapterSetRequest = new RequestCoreV2({
    fetch: setSearchedChapterToChapterProfile,
    client,
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
  const seasonRef = new RefCore<SeasonInTVProfile>();
  const chapterRef = new RefCore<NovelChapterProfileItem>();
  const fileRef = new RefCore<NovelChapterProfileItem["files"][number]>();
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
  const searchedChapterSelect = new SearchedChapterSelectCore({ client });
  const searchedChapterSelectDialog = new DialogCore({
    async onOk() {
      const searchedChapter = searchedChapterSelect.value;
      if (!searchedChapter) {
        app.tip({
          text: ["请先选择关联的章节"],
        });
        return;
      }
      const chapter = chapterRef.value;
      if (!chapter) {
        app.tip({
          text: ["请先要关联的章节"],
        });
        return;
      }
      searchedChapterSelectDialog.okBtn.setLoading(true);
      const r = await searchedChapterSetRequest.run({
        searched_chapter_id: searchedChapter.id,
        chapter_id: chapter.id,
      });
      searchedChapterSelectDialog.okBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: ["设置失败", r.error.message],
        });
        return;
      }
      searchedChapterSelectDialog.hide();
      app.tip({
        text: ["设置成功"],
      });
      chapterList.deleteItem((c) => {
        return c.id === chapter.id;
      });
    },
  });
  const setSearchedChapterBtn = new ButtonInListCore<NovelChapterProfileItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      chapterRef.select(record);
      searchedChapterSelectDialog.show();
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
        searched_chapter_id: theSource.id,
      });
    },
  });
  const seasonContextMenu = new ContextMenuCore({
    items: [deleteSeasonMenuItem],
  });
  const poster = new ImageCore({});
  // const profileTitleInput = new InputCore({
  //   defaultValue: "",
  //   placeholder: "请输入电视剧标题",
  // });
  // const profileEpisodeCountInput = new InputCore({
  //   defaultValue: "",
  //   placeholder: "请输入季剧集总数",
  // });
  // const profileUpdateBtn = new ButtonCore({
  //   onClick() {
  //     profileManualUpdateDialog.show();
  //   },
  // });
  // const profileManualUpdateDialog = new DialogCore({
  //   title: "手动修改详情",
  //   onOk() {
  //     const title = profileTitleInput.value;
  //     const episodeCount = profileEpisodeCountInput.value;
  //     if (!title && !episodeCount) {
  //       app.tip({
  //         text: ["请至少输入一个变更项"],
  //       });
  //       return;
  //     }
  //     profileManualUpdateRequest.run({
  //       season_id: view.query.season_id,
  //       title,
  //       episode_count: episodeCount ? Number(episodeCount) : undefined,
  //     });
  //   },
  // });
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      chapterList.loadMore();
    },
  });

  const [profile, setProfile] = createSignal<NovelProfile | null>(null);
  const [chapterResponse, setChapterResponse] = createSignal(chapterList.response);
  const [curSeason, setCurSeason] = createSignal(seasonRef.value);

  seasonRef.onStateChange((nextState) => {
    setCurSeason(nextState);
  });
  chapterList.onStateChange((nextResponse) => {
    console.log("chapterList", nextResponse.dataSource);
    setChapterResponse(nextResponse);
  });

  onMount(() => {
    profileRequest.run({ novel_id: view.query.id, invalid_chapter: 1 });
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
                        <div class="mt-2">{profile()?.overview}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="relative z-3 mt-4">
                <div class="flex items-center space-x-4 whitespace-nowrap">
                  <Button store={profileChangeBtn}>变更详情</Button>
                  <Button store={profileRefreshBtn}>刷新详情</Button>
                </div>
              </div>
            </div>
            <div class="space-y-4 mt-8">
              <For each={chapterResponse().dataSource}>
                {(chapter) => {
                  const { id, name, files } = chapter;
                  return (
                    <div title={id}>
                      <div
                        class={cn("text-lg", files.length === 0 ? "text-red-500" : "")}
                        onClick={() => {
                          chapterRef.select(chapter);
                          searchedChapterSelectDialog.show();
                        }}
                      >
                        {name}
                      </div>
                      <div class="pl-4 space-y-1">
                        <For each={files}>
                          {(source) => {
                            const { id, name, novel_name, source_name } = source;
                            return (
                              <div class="flex items-center space-x-4 text-slate-500">
                                <span class={cn("break-all")} title={`[${source_name}]${novel_name}`}>
                                  [{source_name}]{name}
                                </span>
                                <div class="flex items-center space-x-2">
                                  <div
                                    class="p-1 cursor-pointer"
                                    title="播放"
                                    onClick={() => {
                                      history.push("root.preview", { id });
                                    }}
                                  >
                                    <Play class="w-4 h-4" />
                                  </div>
                                  <div
                                    class="p-1 cursor-pointer"
                                    title="删除源"
                                    onClick={() => {
                                      fileRef.select(source);
                                      sourceDeletingRequest.run({
                                        searched_chapter_id: id,
                                      });
                                    }}
                                  >
                                    <Trash class="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        </For>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
        <div class="h-[120px]"></div>
      </ScrollView>
      <Dialog store={searchedChapterSelectDialog}>
        <div class="w-[520px]">
          <SearchedChapterSelect store={searchedChapterSelect} />
        </div>
      </Dialog>
      <ContextMenu store={seasonContextMenu} />
    </>
  );
};
