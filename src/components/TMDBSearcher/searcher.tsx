/**
 * @file TMDB 搜索器
 */
import { For, JSX, Show, createSignal } from "solid-js";
import { Search } from "lucide-solid";

import { fetchChaptersOfNovelProfile, prepareSeasonList } from "@/services/media_profile";
import { Button, Input, LazyImage, Label, ListView, ScrollView, Dialog } from "@/components/ui";
import * as Form from "@/components/ui/form";
import { Presence } from "@/components/ui/presence";
import { MediaSearchView } from "@/components/MediaSelect";
import { NovelProfileSearchCore } from "@/domains/tmdb";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { cn } from "@/utils";
import { ImageInListCore, PresenceCore } from "@/domains/ui";
import { NovelSearchCore } from "@/domains/media_search";

export const NovelProfileSearchView = (props: { store: NovelSearchCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  const searchPanel = new PresenceCore({
    open: true,
  });
  const episodePanel = new PresenceCore();
  const poster = new ImageInListCore({});
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      store.$list.loadMore();
    },
  });
  const scrollView2 = new ScrollViewCore({
    onReachBottom() {
      store.$list2.loadMore();
    },
  });

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  const dataSource = () => state().response.dataSource;
  const curNovel = () => state().curNovel;
  const curChapter = () => state().curChapter;

  return (
    <div>
      <Presence
        classList={{
          "opacity-100": true,
          "animate-in slide-in-from-right": true,
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right": true,
        }}
        store={searchPanel}
      >
        <div class="grid gap-4 py-4">
          <Form.Root store={store.$form}>
            <div class="grid grid-cols-12 items-center gap-4">
              <Label class="col-span-2 text-right">名称</Label>
              <div class="col-span-10">
                <Input store={store.$input} />
              </div>
            </div>
          </Form.Root>
          <div class="grid grid-cols-12">
            <div class="col-span-2" />
            <div class="space-x-2 col-span-10">
              <Button class="" store={store.searchBtn}>
                搜索
              </Button>
              <Button class="" variant="subtle" store={store.resetBtn}>
                重置
              </Button>
            </div>
          </div>
        </div>
        <ScrollView store={scrollView} class="relative h-[360px] overflow-y-auto py-2 space-y-4">
          <ListView
            store={store.$list}
            skeleton={
              <div class="relative h-[360px] p-2 space-y-4">
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="flex flex-col items-center justify-center text-slate-500">
                    <Search class="w-24 h-24" />
                    <div class="text-xl">搜索小说</div>
                  </div>
                </div>
              </div>
            }
          >
            <For each={dataSource()}>
              {(media) => {
                const { id, name, cover_path } = media;
                return (
                  <div
                    class={cn("p-2", media.id === curNovel()?.id ? "bg-slate-300" : "bg-white")}
                    onClick={async () => {
                      store.selectNovel(media);
                      searchPanel.hide();
                      episodePanel.show();
                      await store.$list2.init({ novel_id: String(id) });
                      return;
                    }}
                  >
                    <div class="flex">
                      <LazyImage
                        class="w-[120px] rounded-sm object-fit mr-4"
                        store={poster.bind(cover_path)}
                        alt={name}
                      />
                      <div class="flex-1 overflow-hidden text-ellipsis">
                        <div class="text-2xl">{name}</div>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </ListView>
        </ScrollView>
      </Presence>
      <Presence
        classList={{
          "opacity-100": true,
          "animate-in slide-in-from-right": true,
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right": true,
        }}
        store={episodePanel}
      >
        <div class="grid gap-4 py-4">
          <Form.Root store={store.$form2}>
            <div class="grid grid-cols-12 items-center gap-4">
              <Label class="col-span-2 text-right">名称</Label>
              <div class="col-span-10">
                <Input store={store.$input2} />
              </div>
            </div>
          </Form.Root>
          <div class="grid grid-cols-12">
            <div class="col-span-2" />
            <div class="space-x-2 col-span-10">
              <Button class="" store={store.searchBtn2}>
                搜索
              </Button>
              <Button class="" variant="subtle" store={store.resetBtn2}>
                重置
              </Button>
            </div>
          </div>
        </div>
        <ScrollView store={scrollView2} class="relative h-[360px] overflow-y-auto py-2 space-y-4">
          <ListView
            store={store.$list2}
            skeleton={
              <div class="relative h-[360px] p-2 space-y-4">
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="flex flex-col items-center justify-center text-slate-500">
                    <Search class="w-24 h-24" />
                    <div class="text-xl">搜索章节</div>
                  </div>
                </div>
              </div>
            }
          >
            <div class="h-[480px] overflow-y-auto space-y-2">
              <For each={state().response2.dataSource}>
                {(episode) => {
                  const { id, name } = episode;
                  return (
                    <div
                      classList={{
                        "p-2": true,
                        "bg-slate-300": id === curChapter()?.id,
                      }}
                      onClick={() => {
                        store.selectEpisode(episode);
                      }}
                    >
                      <div>{name}</div>
                    </div>
                  );
                }}
              </For>
            </div>
          </ListView>
        </ScrollView>
      </Presence>
    </div>
  );
};
