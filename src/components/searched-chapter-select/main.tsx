/**
 * @file 电视剧选择
 */
import { For, Show, createSignal } from "solid-js";
import { Calendar, Send, Smile } from "lucide-solid";

import {
  SearchedChapterItem,
  fetchSearchedChapterList,
  fetchSearchedChapterListProcess,
} from "@/services/parsed_media";
import { Button, Input, LazyImage, ListView, ScrollView, Skeleton } from "@/components/ui";
import { BaseDomain, Handler } from "@/domains/base";
import { ButtonCore, DialogCore, DialogProps, ImageInListCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { RefCore } from "@/domains/cur";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ListCoreV2 } from "@/domains/list/v2";
import { HttpClientCore } from "@/domains/http_client";
import { UnpackedResult } from "@/types";

enum Events {
  StateChange,
  ResponseChange,
  Change,
  Select,
  Clear,
}
type TheTypesOfEvents = {
  [Events.Select]: SearchedChapterItem;
  [Events.Clear]: void;
};
type SearchedChapterSelectProps = {
  client: HttpClientCore;
  onSelect?: (v: SearchedChapterItem) => void;
} & DialogProps;

export class SearchedChapterSelectCore extends BaseDomain<TheTypesOfEvents> {
  curChapter = new RefCore<SearchedChapterItem>();
  /** 名称搜索输入框 */
  nameInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入名称搜索",
    onEnter: () => {
      this.searchBtn.click();
    },
  });
  /** 搜索按钮 */
  searchBtn = new ButtonCore({
    onClick: () => {
      this.list.search({ name: this.nameInput.value });
    },
  });
  dialog: DialogCore;
  /** 弹窗确定按钮 */
  okBtn: ButtonCore;
  /** 弹窗取消按钮 */
  cancelBtn: ButtonCore;
  /** 季列表 */
  list: ListCoreV2<
    RequestCoreV2<{
      fetch: typeof fetchSearchedChapterList;
      process: typeof fetchSearchedChapterListProcess;
      client: HttpClientCore;
    }>,
    UnpackedResult<ReturnType<typeof fetchSearchedChapterListProcess>>["list"][number]
  >;
  response: ListCoreV2<
    RequestCoreV2<{
      fetch: typeof fetchSearchedChapterList;
      process: typeof fetchSearchedChapterListProcess;
      client: HttpClientCore;
    }>,
    UnpackedResult<ReturnType<typeof fetchSearchedChapterListProcess>>["list"][number]
  >["response"];
  value = this.curChapter.value;
  client: HttpClientCore;

  constructor(props: Partial<{ _name: string }> & SearchedChapterSelectProps) {
    super(props);

    const { client, onSelect, onOk, onCancel } = props;
    this.client = client;
    this.dialog = new DialogCore({
      title: "选择电视剧",
      onOk,
      onCancel,
    });
    this.okBtn = this.dialog.okBtn;
    this.cancelBtn = this.dialog.cancelBtn;
    this.list = new ListCoreV2(
      new RequestCoreV2({
        fetch: fetchSearchedChapterList,
        process: fetchSearchedChapterListProcess,
        client,
      }),
      {
        onLoadingChange: (loading) => {
          this.searchBtn.setLoading(loading);
        },
      }
    );
    this.response = this.list.response;
    this.list.onStateChange((nextState) => {
      this.response = nextState;
    });
    this.curChapter.onStateChange((nextState) => {
      this.value = nextState;
      if (nextState === null) {
        this.emit(Events.Clear);
      }
    });
    if (onSelect) {
      this.onSelect(onSelect);
    }
  }

  show() {
    this.dialog.show();
  }
  hide() {
    this.dialog.hide();
  }
  clear() {
    this.curChapter.clear();
  }
  select(season: SearchedChapterItem) {
    this.curChapter.select(season);
    this.emit(Events.Select, season);
  }

  onResponseChange(handler: Parameters<typeof this.list.onStateChange>[0]) {
    return this.list.onStateChange(handler);
  }
  onCurSeasonChange(handler: Parameters<typeof this.curChapter.onStateChange>[0]) {
    return this.curChapter.onStateChange(handler);
  }
  onSelect(handler: Handler<TheTypesOfEvents[Events.Select]>) {
    return this.on(Events.Select, handler);
  }
  onClear(handler: Handler<TheTypesOfEvents[Events.Clear]>) {
    return this.on(Events.Clear, handler);
  }
}

export const SearchedChapterSelect = (props: { store: SearchedChapterSelectCore }) => {
  const { store } = props;

  const [tvListResponse, setTVListResponse] = createSignal(store.response);
  const [curSeason, setCurSeason] = createSignal(store.value);

  const poster = new ImageInListCore({});
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      store.list.loadMore();
    },
  });

  store.onResponseChange((nextState) => {
    setTVListResponse(nextState);
  });
  store.onCurSeasonChange((nextState) => {
    setCurSeason(nextState);
  });

  store.list.init();

  return (
    <div>
      <div class="flex items-center space-x-2 mt-4">
        <Input store={store.nameInput} />
        <Button store={store.searchBtn} variant="subtle">
          搜索
        </Button>
      </div>
      <ScrollView class="mt-2 h-[480px] overflow-y-auto" store={scrollView}>
        <ListView
          store={store.list}
          skeleton={
            <div>
              <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                <div class="flex">
                  <div class="overflow-hidden mr-2 rounded-sm">
                    <Skeleton class="w-[120px] h-[180px]" />
                  </div>
                  <div class="flex-1 p-4">
                    <Skeleton class="h-[36px] w-[180px]"></Skeleton>
                    <div class="mt-2 space-y-1">
                      <Skeleton class="h-[24px] w-[120px]"></Skeleton>
                      <Skeleton class="h-[24px] w-[240px]"></Skeleton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <div class="space-y-4">
            <For each={tvListResponse().dataSource}>
              {(season) => {
                const { id, name, searched_novel } = season;
                return (
                  <div
                    classList={{
                      "rounded-md border bg-white shadow-sm": true,
                      "border-green-500": curSeason()?.id === id,
                      "border-slate-300 ": curSeason()?.id !== id,
                    }}
                    onClick={() => {
                      // store.select(season);
                    }}
                  >
                    <div class="flex">
                      <div class="flex-1 w-0 p-4">
                        <div class="">
                          <div class="text-xl text-slate-800">{searched_novel.name}</div>
                          <div class="mt-2">{name}</div>
                          <div class="mt-2 text-sm">{searched_novel.source_name}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </ListView>
      </ScrollView>
    </div>
  );
};
