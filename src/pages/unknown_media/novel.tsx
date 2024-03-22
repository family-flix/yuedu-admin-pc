/**
 * @file 所有搜索到的小说
 */
import { For, Show, createSignal } from "solid-js";
import { AlertCircle, Brush, Check, CheckCircle, Edit, RotateCcw, Search, Trash } from "lucide-solid";

import { ViewComponent } from "@/store/types";
import { fetchSearchedNovelList } from "@/services/parsed_media";
import { Button, Input, LazyImage, ListView, ScrollView } from "@/components/ui";
import { ButtonCore, ButtonInListCore, ImageCore, ImageInListCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { NovelSearchCore } from "@/domains/media_search";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ListCoreV2 } from "@/domains/list/v2";

export const SearchedNovelListPage: ViewComponent = (props) => {
  const { app, client, history, view } = props;

  const list = new ListCoreV2(
    new RequestCoreV2({
      fetch: fetchSearchedNovelList,
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
  const coverImg = new ImageInListCore({});
  const renameFileInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入新的文件名称",
  });
  const mediaSearch = new NovelSearchCore();
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
  const profileBtn = new ButtonInListCore({
    onClick(novel) {
      history.push("root.home_layout");
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
              {(novel) => {
                const { id, name, profile, source } = novel;
                return (
                  <div
                    class="flex p-4 bg-white rounded-sm"
                    onClick={() => {
                      history.push("root.home_layout.parse_result_layout.novel_profile", { id });
                    }}
                  >
                    <div class="flex-1">
                      <div class="mt-4">
                        <div class="flex space-x-2 text-sm">
                          <div class="rounded-md overflow-hidden">
                            <LazyImage class="w-[80px]" store={coverImg.bind(profile.cover_path)} />
                          </div>
                          <div class="ml-4">
                            <div class="text-lg">{profile.name}</div>
                            <div class="mt-4">{source.name}</div>
                          </div>
                        </div>
                      </div>
                      <div class="flex mt-4 space-x-2">
                        <Button
                          class="box-content"
                          variant="subtle"
                          store={profileBtn.bind(novel)}
                          icon={<Brush class="w-4 h-4" />}
                        >
                          详情
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </ListView>
      </ScrollView>
    </>
  );
};
