/**
 * @file 搜索本地数据库已归档的影视剧详情
 */
import {
  fetchChaptersOfNovelProfile,
  fetchMediaProfileList,
  MediaProfileItem,
  searchNovelProfile,
  TheNovelChapterProfile,
  TheNovelProfile,
} from "@/services/media_profile";
import { BaseDomain, Handler } from "@/domains/base";
import { ButtonCore, InputCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { Response } from "@/domains/list/typing";
import { FormCore } from "@/domains/ui/form";
import { RequestCore } from "@/domains/request";
import { MediaTypes } from "@/constants";

enum Events {
  Select,
  UnSelect,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Select]: TheNovelProfile;
  [Events.UnSelect]: null;
  [Events.StateChange]: MediaSearchState;
};
interface MediaSearchState {
  response: Response<TheNovelProfile>;
  response2: Response<TheNovelChapterProfile>;
  curNovel: TheNovelProfile | null;
  curChapter: TheNovelChapterProfile | null;
}
type MediaSearchProps = {
  onSelect?: (value: TheNovelProfile | null) => void;
};

export class NovelSearchCore extends BaseDomain<TheTypesOfEvents> {
  $list = new ListCore(new RequestCore(searchNovelProfile));
  $list2 = new ListCore(new RequestCore(fetchChaptersOfNovelProfile));
  $form: FormCore<{}>;
  $input: InputCore<string>;
  searchBtn: ButtonCore;
  resetBtn: ButtonCore;
  $form2: FormCore<{}>;
  $input2: InputCore<string>;
  searchBtn2: ButtonCore;
  resetBtn2: ButtonCore;

  curNovel: null | TheNovelProfile = null;
  curChapter: null | TheNovelChapterProfile = null;

  get state(): MediaSearchState {
    return {
      curNovel: this.curNovel,
      curChapter: this.curChapter,
      response: this.$list.response,
      response2: this.$list2.response,
    };
  }

  constructor(options: Partial<{ _name: string } & MediaSearchProps> = {}) {
    super(options);

    const { onSelect } = options;
    this.$form = new FormCore<{}>();
    this.searchBtn = new ButtonCore({
      onClick: () => {
        if (!this.$input.value) {
          this.tip({ text: ["请输入查询关键字"] });
          return;
        }
        this.$list.search({ keyword: this.$input.value });
      },
    });
    this.resetBtn = new ButtonCore({
      onClick: () => {
        this.$input.clear();
        this.$list.clear();
      },
    });
    this.$input = new InputCore({
      defaultValue: "",
      placeholder: "请输入名称",
      onEnter: () => {
        this.searchBtn.click();
      },
    });
    this.$form2 = new FormCore<{}>();
    this.searchBtn2 = new ButtonCore({
      onClick: () => {
        if (!this.$input2.value) {
          this.tip({ text: ["请输入查询关键字"] });
          return;
        }
        this.$list2.search({ keyword: this.$input2.value });
      },
    });
    this.resetBtn2 = new ButtonCore({
      onClick: () => {
        this.$input2.clear();
        this.$list2.clear();
      },
    });
    this.$input2 = new InputCore({
      defaultValue: "",
      placeholder: "请输入名称",
      onEnter: () => {
        this.searchBtn2.click();
      },
    });
    this.$list.onStateChange((nextState) => {
      this.emit(Events.StateChange, { ...this.state });
    });
    this.$list.onLoadingChange((loading) => {
      this.searchBtn.setLoading(loading);
    });
    this.$list2.onStateChange((nextState) => {
      this.emit(Events.StateChange, { ...this.state });
    });
    this.$list2.onLoadingChange((loading) => {
      this.searchBtn2.setLoading(loading);
    });
    if (onSelect) {
      this.onSelect((v) => {
        onSelect(v);
      });
      this.onUnSelect(() => {
        onSelect(null);
      });
    }
  }

  search(body: Parameters<typeof this.$list.search>[0]) {
    this.$list.search(body);
  }

  selectNovel(v: TheNovelProfile) {
    this.curNovel = v;
    this.emit(Events.StateChange, { ...this.state });
  }
  selectEpisode(v: TheNovelChapterProfile) {
    this.curChapter = v;
    this.emit(Events.StateChange, { ...this.state });
  }
  toggle(v: TheNovelProfile) {
    if (this.curNovel === v) {
      this.curNovel = null;
      this.emit(Events.UnSelect, null);
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    this.curNovel = v;
    this.emit(Events.Select, v);
    this.emit(Events.StateChange, { ...this.state });
  }

  onSelect(handler: Handler<TheTypesOfEvents[Events.Select]>) {
    this.on(Events.Select, handler);
  }
  onUnSelect(handler: Handler<TheTypesOfEvents[Events.UnSelect]>) {
    this.on(Events.UnSelect, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
