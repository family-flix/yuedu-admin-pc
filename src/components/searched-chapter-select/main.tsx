/**
 * @file 电视剧选择
 */
import { For, Show, createSignal } from "solid-js";
import { Calendar, Send, Smile } from "lucide-solid";

import { SearchedChapterItem, fetchSearchedChapterList } from "@/services/parsed_media";
import { BaseDomain, Handler } from "@/domains/base";
import { ButtonCore, DialogCore, DialogProps, ImageInListCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { RefCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { Button, Input, LazyImage, ListView, ScrollView, Skeleton } from "@/components/ui";

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
type TVSeasonSelectProps = {
  onSelect?: (v: SearchedChapterItem) => void;
} & DialogProps;

export class SearchedChapterSelectCore extends BaseDomain<TheTypesOfEvents> {
  curSeason = new RefCore<SearchedChapterItem>();
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
  list = new ListCore(new RequestCore(fetchSearchedChapterList), {
    onLoadingChange: (loading) => {
      this.searchBtn.setLoading(loading);
    },
  });
  response = this.list.response;
  value = this.curSeason.value;

  constructor(props: Partial<{ _name: string }> & TVSeasonSelectProps) {
    super(props);

    const { onSelect, onOk, onCancel } = props;
    this.dialog = new DialogCore({
      title: "选择电视剧",
      onOk,
      onCancel,
    });
    this.okBtn = this.dialog.okBtn;
    this.cancelBtn = this.dialog.cancelBtn;

    this.list.onStateChange((nextState) => {
      this.response = nextState;
    });
    this.curSeason.onStateChange((nextState) => {
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
    this.curSeason.clear();
  }
  select(season: SearchedChapterItem) {
    //     console.log("[COMPONENT]TVSeasonSelect - select", season);
    this.curSeason.select(season);
    this.emit(Events.Select, season);
  }

  onResponseChange(handler: Parameters<typeof this.list.onStateChange>[0]) {
    return this.list.onStateChange(handler);
  }
  onCurSeasonChange(handler: Parameters<typeof this.curSeason.onStateChange>[0]) {
    return this.curSeason.onStateChange(handler);
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
    //     console.log("[COMPONENT]TVSeasonSelect - store.onCurSeasonChange", nextState);
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
                      store.select(season);
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
