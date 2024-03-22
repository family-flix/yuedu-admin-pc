/**
 * @file 未识别的剧集
 */
import { For, Show, createSignal } from "solid-js";
import { AlertCircle, Brush, Check, CheckCircle, Edit, RotateCcw, Search, Trash } from "lucide-solid";

import { SearchedChapterItem, fetchSearchedChapterList, fetchSearchedChapterListProcess, setSearchedChapterProfile } from "@/services/parsed_media";
import { delete_unknown_episode } from "@/services";
import { ViewComponent } from "@/store/types";
import { Button, Dialog, Input, LazyImage, ListView, ScrollView } from "@/components/ui";
import { NovelProfileSearchView } from "@/components/TMDBSearcher";
import {
  ButtonCore,
  ButtonInListCore,
  DialogCore,
  ImageCore,
  ImageInListCore,
  InputCore,
  ScrollViewCore,
} from "@/domains/ui";
import { NovelProfileSearchCore } from "@/domains/tmdb";
import { RefCore } from "@/domains/cur";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { MediaTypes } from "@/constants";
import { NovelSearchCore } from "@/domains/media_search";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ListCoreV2 } from "@/domains/list/v2";

export const SearchedChapterListPage: ViewComponent = (props) => {
  const { app, client, view } = props;

  const list = new ListCoreV2(
    new RequestCoreV2({
      fetch: fetchSearchedChapterList,
      process: fetchSearchedChapterListProcess,
      client,
    }),
    {
      onLoadingChange(loading) {
        refreshBtn.setLoading(loading);
      },
    }
  );
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });
  const deleteUnknownEpisode = new RequestCore(delete_unknown_episode, {
    onLoading(loading) {
      deleteConfirmDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["删除剧集失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["删除成功"] });
      deleteConfirmDialog.hide();
      list.deleteItem((item) => {
        if (item.id === curEpisode.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
  const curEpisode = new RefCore<SearchedChapterItem>();
  const mediaSourceRef = new RefCore<SearchedChapterItem>();
  const selectMatchedProfileBtn = new ButtonInListCore<SearchedChapterItem>({
    onClick(record) {
      curEpisode.select(record);
      setChapterProfileDialog.show();
    },
  });
  const renameFileInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入新的文件名称",
  });
  const deleteConfirmDialog = new DialogCore({
    title: "删除",
    onOk() {
      if (!curEpisode.value) {
        app.tip({ text: ["请先选择要删除的剧集"] });
        return;
      }
      deleteUnknownEpisode.run({ id: curEpisode.value.id });
    },
  });
  const deleteBtn = new ButtonInListCore<SearchedChapterItem>({
    onClick(record) {
      curEpisode.select(record);
      deleteConfirmDialog.setTitle(`确认删除 ${record.name} 吗？`);
      deleteConfirmDialog.show();
    },
  });
  const setMediaSourceProfileRequest = new RequestCoreV2({
    fetch: setSearchedChapterProfile,
    client,
    onLoading(loading) {
      setChapterProfileDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["修改失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      setChapterProfileDialog.hide();
      list.deleteItem((movie) => {
        if (movie.id === curEpisode.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
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
  const resetBtn = new ButtonCore({
    onClick() {
      nameSearchInput.clear();
      list.reset();
    },
  });
  const nameSearchInput = new InputCore({
    defaultValue: "",
    onEnter() {
      searchBtn.click();
    },
  });
  const searchBtn = new ButtonCore({
    onClick() {
      if (!nameSearchInput.value) {
        return;
      }
      list.search({ name: nameSearchInput.value });
    },
  });
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      list.loadMore();
    },
  });
  const poster = new ImageInListCore({});
  const folderImg = new ImageCore({
    src: "https://img.alicdn.com/imgextra/i1/O1CN01rGJZac1Zn37NL70IT_!!6000000003238-2-tps-230-180.png",
  });

  const [response, setResponse] = createSignal(list.response);

  list.onStateChange((nextState) => {
    setResponse(nextState);
  });

  view.onShow(() => {
    list.init();
  });

  const dataSource = () => response().dataSource;

  return (
    <>
      <ScrollView class="px-8 pb-12" store={scrollView}>
        <div class="my-4 flex items-center space-x-2">
          <Button icon={<RotateCcw class="w-4 h-4" />} store={refreshBtn}>
            刷新
          </Button>
          <Button store={resetBtn}>重置</Button>
        </div>
        <div class="flex items-center space-x-2 mt-4">
          <Input class="" store={nameSearchInput} />
          <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
            搜索
          </Button>
        </div>
        <ListView
          class="mt-4"
          store={list}
          // skeleton={
          //   <div class="grid grid-cols-3 gap-2 lg:grid-cols-6">
          //     <div class="w-[152px] rounded">
          //       <FolderCardSkeleton />
          //       <div class="flex justify-center mt-2">
          //         <Skeleton class="block box-content"></Skeleton>
          //       </div>
          //     </div>
          //   </div>
          // }
        >
          <div class="space-y-4">
            <For each={dataSource()}>
              {(episode) => {
                const { id, name, profile } = episode;
                return (
                  <div class="flex p-4 bg-white rounded-sm">
                    <div class="flex-1">
                      <div class="text-lg">{name}</div>
                      <div class="mt-4">
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
                      <div class="flex items-center mt-4 space-x-2">
                        {/* <Button
                          class="box-content"
                          variant="subtle"
                          store={selectMatchedProfileBtn.bind(episode)}
                          icon={<Brush class="w-4 h-4" />}
                        >
                          设置
                        </Button> */}
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </ListView>
      </ScrollView>
      <Dialog store={setChapterProfileDialog}>
        <div class="w-[520px]">
          <NovelProfileSearchView store={mediaSearch} />
        </div>
      </Dialog>
      <Dialog store={deleteConfirmDialog}>
        <div>仅删除该记录，不删除云盘文件。</div>
      </Dialog>
    </>
  );
};
