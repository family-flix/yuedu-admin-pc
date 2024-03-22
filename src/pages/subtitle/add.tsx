/**
 * @file 导入小说数据
 */
import { For, Show, createSignal } from "solid-js";
import { Eye, Loader } from "lucide-solid";

import { importNovelData } from "@/services/other";
import { ViewComponent } from "@/store/types";
import { Dialog, ScrollView } from "@/components/ui";
import { FileReaderCore } from "@/components/SubtitlePreview";
import { DialogCore, ScrollViewCore } from "@/domains/ui";
import { RequestCoreV2 } from "@/domains/request/v2";
import { DragZoneCore } from "@/domains/ui/drag-zone";

export const HomeSubtitleUploadPage: ViewComponent = (props) => {
  const { app, client, view } = props;

  const filenameValidatingRequest = new RequestCoreV2({
    fetch: importNovelData,
    client,
    onFailed(error) {
      app.tip({
        text: ["校验失败", error.message],
      });
    },
    onSuccess() {
      app.tip({
        text: ["上传成功"],
      });
    },
  });
  const uploadZone = new DragZoneCore({
    onChange(files) {
      const file = files[0];
      if (!file) {
        app.tip({
          text: ["请上传文件"],
        });
        return;
      }
      filenameValidatingRequest.run(file);
    },
  });
  const uploadLoadingDialog = new DialogCore({
    title: "上传字幕",
    footer: false,
    closeable: false,
  });
  const fileReader = new FileReaderCore({});
  const scrollView = new ScrollViewCore();

  const [state, setState] = createSignal(uploadZone.state);
  const [results, setResults] = createSignal(filenameValidatingRequest.response);

  uploadZone.onStateChange((nextState) => {
    setState(nextState);
  });
  filenameValidatingRequest.onResponseChange((v) => {
    setResults(v);
  });

  return (
    <>
      <ScrollView store={scrollView} class="relative h-screen p-8">
        <h1 class="text-2xl">上传文件</h1>
        <div class="flex space-x-4 mt-8 w-full">
          <div class="flex-1">
            <div
              classList={{
                "relative w-full min-h-[180px] rounded-sm bg-slate-200 border border-2 cursor-pointer": true,
                "border-green-500 border-dash": state().hovering,
              }}
              onDragOver={(event) => {
                event.preventDefault();
                uploadZone.handleDragover();
              }}
              onDragLeave={() => {
                uploadZone.handleDragleave();
              }}
              onDrop={(event) => {
                event.preventDefault();
                uploadZone.handleDrop(Array.from(event.dataTransfer?.files || []));
              }}
            >
              <Show
                when={!!results()}
                fallback={
                  <div class="absolute inset-0 flex items-center justify-center cursor-pointer">
                    <div class="p-4 text-center">
                      <p>将文件拖拽至此或点击选择文件</p>
                      <input type="file" class="absolute inset-0 opacity-0" />
                    </div>
                  </div>
                }
              >
                <div>已上传</div>
              </Show>
            </div>
          </div>
        </div>
      </ScrollView>
      <Dialog store={uploadLoadingDialog}>
        <div class="flex flex-col items-center w-[520px]">
          <div>
            <Loader class="w-8 h-8 animate animate-spin" />
          </div>
          <div class="mt-4">正在上传中，请等待</div>
        </div>
      </Dialog>
    </>
  );
};
