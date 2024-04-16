/**
 * @file 电影列表
 */
import { createSignal, For, Show } from "solid-js";
import { Award, BookOpen, Calendar, Clock, Info, LocateIcon, MapPin, RotateCw, Search, Star } from "lucide-solid";

import { fetchNovelChapterProfileList, NovelChapterProfileItem, setSearchedChapterToChapterProfile } from "@/services/media";
import { moveMovieToResourceDrive, refreshMovieProfiles, transferMovieToAnotherDrive } from "@/services";
import { LazyImage, Input, Button, Skeleton, ScrollView, ListView, Dialog } from "@/components/ui";
import { InputCore, ButtonCore, ButtonInListCore, ScrollViewCore, DialogCore, CheckboxGroupCore, PopoverCore, ImageInListCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { DriveCore } from "@/domains/drive";
import { ViewComponent } from "@/store/types";
import { consumeAction, pendingActions } from "@/store/actions";
import { createJob } from "@/store/job";
import { driveList } from "@/store/drives";
import { SearchedChapterSelect, SearchedChapterSelectCore } from "@/components/searched-chapter-select";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ListCoreV2 } from "@/domains/list/v2";
import { fetchSearchedChapterList, fetchSearchedNovelList } from "@/services/parsed_media";

export const MovieListPage: ViewComponent = (props) => {
  const { app, client, history, view } = props;
  const searchedChapterSetRequest = new RequestCoreV2({
    fetch: setSearchedChapterToChapterProfile,
    client,
  });
  const movieList = new ListCoreV2(
    new RequestCoreV2({
      fetch: fetchSearchedChapterList,
      client,
    }),
    {
      onLoadingChange(loading) {
        searchBtn.setLoading(loading);
        resetBtn.setLoading(loading);
        refreshBtn.setLoading(loading);
      },
    }
  );
  const refreshMovieProfilesRequest = new RequestCore(refreshMovieProfiles, {
    beforeRequest() {
      refreshMovieListBtn.setLoading(true);
    },
    async onSuccess(r) {
      createJob({
        job_id: r.job_id,
        onFinish() {
          app.tip({ text: ["更新成功"] });
          movieList.refresh();
          refreshMovieListBtn.setLoading(false);
        },
      });
    },
    onFailed(error) {
      app.tip({ text: ["更新失败", error.message] });
      refreshMovieListBtn.setLoading(false);
    },
  });
  const refreshMovieListBtn = new ButtonCore({
    onClick() {
      app.tip({ text: ["开始更新"] });
      refreshMovieProfilesRequest.run();
    },
  });
  const movieRef = new RefCore<NovelChapterProfileItem>();
  const driveRef = new RefCore<DriveCore>({
    onChange(v) {
      setCurDrive(v);
    },
  });
  const nameSearchInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入名称搜索",
    onEnter() {
      searchBtn.click();
    },
  });
  const searchBtn = new ButtonCore({
    onClick() {
      movieList.search({ name: nameSearchInput.value });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      movieList.reset();
      nameSearchInput.clear();
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
      const chapter = movieRef.value;
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
    },
  });
  const setSearchedChapterBtn = new ButtonInListCore<NovelChapterProfileItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      movieRef.select(record);
      searchedChapterSelectDialog.show();
    },
  });
  const avatar = new ImageInListCore({});
  const poster = new ImageInListCore({});
  const refreshBtn = new ButtonCore({
    onClick() {
      movieList.refresh();
    },
  });
  const driveCheckboxGroup = new CheckboxGroupCore({
    options: driveList.response.dataSource.map((d) => {
      const { name, id } = d;
      return {
        value: id,
        label: name,
      };
    }),
    onChange(options) {
      // setHasSearch(!!options.length);
      // seasonList.search({
      //   drive_ids: options.join("|"),
      // });
    },
  });
  const scrollView = new ScrollViewCore();

  const [state, setState] = createSignal(movieList.response);
  const [driveResponse, setDriveResponse] = createSignal(driveList.response);
  const [curDrive, setCurDrive] = createSignal(driveRef.value);
  const [tips, setTips] = createSignal<string[]>([]);

  view.onShow(() => {
    const { deleteMovie } = pendingActions;
    if (!deleteMovie) {
      return;
    }
    consumeAction("deleteMovie");
    movieList.deleteItem((movie) => {
      if (movie.id === deleteMovie.movie_id) {
        return true;
      }
      return false;
    });
  });
  scrollView.onReachBottom(() => {
    movieList.loadMore();
  });
  movieList.onStateChange((nextState) => {
    setState(nextState);
  });
  driveList.onStateChange((nextResponse) => {
    const driveCheckBoxGroupOptions = nextResponse.dataSource.map((d) => {
      const { name, id } = d;
      return {
        value: id,
        label: name,
      };
    });
    driveCheckboxGroup.setOptions(driveCheckBoxGroupOptions);
    setDriveResponse(nextResponse);
  });
  movieList.init();
  // driveList.initAny();

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8">
        <h1 class="text-2xl">电影列表({state().total})</h1>
        <div class="mt-8">
          <div class="flex items-center space-x-2">
            <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
              刷新
            </Button>
            <Button class="" store={resetBtn}>
              重置
            </Button>
            {/* <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshMovieListBtn}>
              更新近3月内电影详情
            </Button> */}
          </div>
          <div class="flex items-center space-x-2 mt-4">
            <Input class="" store={nameSearchInput} />
            <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
              搜索
            </Button>
          </div>
          <div class="mt-4">
            <ListView
              store={movieList}
              skeleton={
                <div>
                  <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                    <div class="flex">
                      <div class="overflow-hidden mr-2 rounded-sm">
                        <Skeleton class="w-[180px] h-[272px]" />
                      </div>
                      <div class="flex-1 p-4">
                        <Skeleton class="h-[36px] w-[180px]"></Skeleton>
                        <div class="mt-2 space-y-1">
                          <Skeleton class="h-[24px] w-[120px]"></Skeleton>
                          <Skeleton class="h-[24px] w-[240px]"></Skeleton>
                        </div>
                        <div class="flex items-center space-x-4 mt-2">
                          <Skeleton class="w-10 h-6"></Skeleton>
                          <Skeleton class="w-10 h-6"></Skeleton>
                          <Skeleton class="w-10 h-6"></Skeleton>
                        </div>
                        <div class="flex space-x-2 mt-6">
                          <Skeleton class="w-24 h-8"></Skeleton>
                          <Skeleton class="w-24 h-8"></Skeleton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <div class="space-y-4">
                <For each={state().dataSource}>
                  {(movie) => {
                    const { id, name, profile } = movie;
                    // const url = history.buildURLWithPrefix("root.home_layout.movie_profile", { id });
                    return (
                      <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                        <div class="flex">
                          <div class="flex-1 w-0 p-4">
                            <div class="flex items-center space-x-4 mt-2">{name}</div>
                            {/* <div class="space-x-2 mt-6">{file_count}</div> */}
                            {/* <Button variant="subtle" store={setSearchedChapterBtn.bind(movie)}>
                              关联详情
                            </Button> */}
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </ListView>
          </div>
        </div>
      </ScrollView>
      <Dialog store={searchedChapterSelectDialog}>
        <div class="w-[520px]">
          <SearchedChapterSelect store={searchedChapterSelect} />
        </div>
      </Dialog>
    </>
  );
};
