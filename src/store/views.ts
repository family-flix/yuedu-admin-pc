import { JSXElement } from "solid-js";

import { HomeLayout } from "@/pages/home/layout";
import { HomeIndexPage } from "@/pages/home";
import { HomeSeasonListPage } from "@/pages/season";
import { HomeSeasonProfilePage } from "@/pages/season/profile";
import { UnknownMediaLayout } from "@/pages/unknown_media/layout";
import { SearchedChapterListPage } from "@/pages/unknown_media/chapter";
import { SearchedNovelProfilePage } from "@/pages/unknown_media/profile";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { NotFoundPage } from "@/pages/notfound";
import { LogListPage } from "@/pages/job";
import { LogProfilePage } from "@/pages/job/profile";
import { TestPage } from "@/pages/test";
import { PersonListPage } from "@/pages/person";
import { SharedFilesTransferPage } from "@/pages/resource";
import { MovieListPage } from "@/pages/movie";
import { MovieProfilePage } from "@/pages/movie/profile";
import { MediaPlayingPage } from "@/pages/play/index";
import { SyncTaskListPage } from "@/pages/sync_task";
import { HomeMemberListPage } from "@/pages/member";
import { VideoParsingPage } from "@/pages/parse";
import { HomeReportListPage } from "@/pages/report";
import { HomePermissionPage } from "@/pages/permission";
import { HomeSubtitleUploadPage } from "@/pages/subtitle/add";
import { HomeSubtitleListPage } from "@/pages/subtitle";
import { SharedFilesHistoryPage } from "@/pages/resource/list";
import { SharedFilesTransferListPage } from "@/pages/resource/transfer";
import { InvalidMediaListPage } from "@/pages/media_error";
import { OuterMediaProfilePage } from "@/pages/outer_profile";

import { ViewComponent } from "@/store/types";

import { PageKeys } from "./routes";
import { SearchedNovelListPage } from "@/pages/unknown_media/novel";

export const pages: Omit<Record<PageKeys, ViewComponent>, "root"> = {
  "root.home_layout": HomeLayout,
  "root.home_layout.index": HomeIndexPage,
  "root.home_layout.season_list": HomeSeasonListPage,
  "root.home_layout.season_profile": HomeSeasonProfilePage,
  "root.home_layout.movie_list": MovieListPage,
  "root.home_layout.movie_profile": MovieProfilePage,
  "root.home_layout.invalid_media_list": InvalidMediaListPage,
  "root.home_layout.permission": PersonListPage,
  "root.home_layout.person_list": HomePermissionPage,
  "root.home_layout.parse_result_layout": UnknownMediaLayout,
  "root.home_layout.parse_result_layout.novel": SearchedNovelListPage,
  "root.home_layout.parse_result_layout.chapter": SearchedChapterListPage,
  "root.home_layout.parse_result_layout.novel_profile": SearchedNovelProfilePage,
  "root.home_layout.member_list": HomeMemberListPage,
  "root.home_layout.resource_sync": SyncTaskListPage,
  "root.home_layout.job_list": LogListPage,
  "root.home_layout.job_profile": LogProfilePage,
  "root.home_layout.report_list": HomeReportListPage,
  "root.home_layout.subtitles_list": HomeSubtitleListPage,
  "root.home_layout.subtitles_create": HomeSubtitleUploadPage,
  "root.preview": MediaPlayingPage,
  "root.login": LoginPage,
  "root.register": RegisterPage,
  "root.notfound": NotFoundPage,
};
