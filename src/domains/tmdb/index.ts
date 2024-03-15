import { TheNovelProfile, searchNovelProfile } from "@/services/media_profile";
import { BaseDomain, Handler } from "@/domains/base";
import { ButtonCore, InputCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { Response } from "@/domains/list/typing";
import { FormCore } from "@/domains/ui/form";
import { RequestCore } from "@/domains/request";
import { MediaTypes } from "@/constants";

enum Events {
  Select,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Select]: TheNovelProfile;
  [Events.StateChange]: TMDBSearcherState;
};
interface TMDBSearcherState {
  response: Response<TheNovelProfile>;
  cur: TheNovelProfile | null;
  curEpisode: { id: string | number } | null;
}
type TMDBSearcherProps = {};

export class NovelProfileSearchCore extends BaseDomain<TheTypesOfEvents> {
  $list = new ListCore(new RequestCore(searchNovelProfile));
  $form: FormCore<{}>;
  $input: InputCore<string>;
  searchBtn: ButtonCore;
  resetBtn: ButtonCore;

  cur: null | TheNovelProfile = null;
  curEpisode: null | { id: string | number } = null;
  needEpisode = false;
  get state(): TMDBSearcherState {
    return {
      response: this.$list.response,
      cur: this.cur,
      curEpisode: this.curEpisode,
    };
  }

  constructor(options: Partial<{ _name: string } & TMDBSearcherProps> = {}) {
    super(options);

    // console.log("[DOMAIN]TMDB - constructor ", this.list.response);
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
    this.$list.onStateChange((nextState) => {
      this.emit(Events.StateChange, { ...this.state });
    });
    this.$list.onLoadingChange((loading) => {
      this.searchBtn.setLoading(loading);
    });
  }

  search(body: Parameters<typeof this.$list.search>[0]) {
    this.$list.search(body);
  }
  select(v: TheNovelProfile) {
    this.cur = v;
    this.emit(Events.StateChange, { ...this.state });
  }
  selectEpisode(v: { id: string | number }) {
    this.curEpisode = v;
    this.emit(Events.StateChange, { ...this.state });
  }
  unSelect() {
    this.cur = null;
    this.emit(Events.StateChange, { ...this.state });
  }
  toggle(v: TheNovelProfile) {
    if (this.cur === v) {
      this.cur = null;
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    this.cur = v;
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
