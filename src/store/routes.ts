/**
 * @file 路由配置
 */
const configure = {
  root: {
    title: "ROOT",
    pathname: "/",
    children: {
      home_layout: {
        title: "首页布局",
        pathname: "/home",
        children: {
          index: {
            title: "首页",
            pathname: "/home/index",
            children: {},
          },
          season_list: {
            title: "电视剧列表",
            pathname: "/home/season",
            children: {},
          },
          season_profile: {
            title: "电视剧详情",
            pathname: "/home/season_profile",
            children: {},
          },
          movie_list: {
            title: "电影列表",
            pathname: "/home/movie",
            children: {},
          },
          // movie_profile: {
          //   title: "电影详情",
          //   pathname: "/home/movie_profile",
          //   children: {},
          // },
          // invalid_media_list: {
          //   title: "影视剧待处理问题",
          //   pathname: "/home/invalid_media",
          //   children: {},
          // },
          person_list: {
            title: "参演人员列表",
            pathname: "/home/person",
            children: {},
          },
          job_list: {
            title: "日志",
            pathname: "/home/log",
            children: {},
          },
          job_profile: {
            title: "日志详情",
            pathname: "/home/log_profile",
            children: {},
          },
          member_list: {
            title: "成员列表",
            pathname: "/home/member",
            children: {},
          },
          parse_result_layout: {
            title: "解析结果",
            pathname: "/home/unknown_media",
            children: {
              novel: {
                title: "电视剧解析结果",
                pathname: "/home/unknown_media/novel",
                children: {},
              },
              novel_profile: {
                title: "电视剧解析结果",
                pathname: "/home/unknown_media/novel_profile",
                children: {},
              },
              chapter: {
                title: "电视剧解析结果",
                pathname: "/home/unknown_media/chapter",
                children: {},
              },
            },
          },
          permission: {
            title: "权限列表",
            pathname: "/home/permission",
            children: {},
          },
          resource_sync: {
            title: "同步任务列表",
            pathname: "/home/resource_sync",
            children: {},
          },
          subtitles_list: {
            title: "字幕列表",
            pathname: "/home/subtitles",
            children: {},
          },
          subtitles_create: {
            title: "字幕上传",
            pathname: "/home/subtitles/create",
            children: {},
          },
          // report_list: {
          //   title: "问题列表",
          //   pathname: "/home/report",
          //   children: {},
          // },
        },
      },
      preview: {
        title: "预览",
        pathname: "/home/preview",
        children: {},
      },
      login: {
        title: "管理员登录",
        pathname: "/login",
        children: {},
      },
      register: {
        title: "管理员注册",
        pathname: "/register",
        children: {},
      },
      notfound: {
        title: "404",
        pathname: "/notfound",
        children: {},
      },
    },
  },
};

function apply(
  configure: OriginalRouteConfigure,
  parent: {
    pathname: PathnameKey;
    name: string;
  }
): RouteConfig[] {
  const routes = Object.keys(configure).map((key) => {
    const config = configure[key];
    const { title, pathname, children } = config;
    // 一个 hack 操作，过滤掉 root
    const name = [parent.name, key].filter(Boolean).join(".") as PageKeys;
    if (children) {
      const subRoutes = apply(children, {
        name,
        pathname,
      });
      return [
        {
          title,
          name,
          pathname,
          // component,
          parent: {
            name: parent.name,
          },
        },
        ...subRoutes,
      ];
    }
    return [
      {
        title,
        name,
        pathname,
        // component,
        parent: {
          name: parent.name,
        },
      },
    ];
  });
  return routes.reduce((a, b) => {
    return a.concat(b);
  }, []);
}
const configs = apply(configure, {
  name: "",
  pathname: "/",
});
export const routes: Record<PathnameKey, RouteConfig> = configs
  .map((a) => {
    return {
      [a.name]: a,
    };
  })
  .reduce((a, b) => {
    return {
      ...a,
      ...b,
    };
  }, {});
// @ts-ignore
window.__routes__ = routes;
export const routesWithPathname: Record<PathnameKey, RouteConfig> = configs
  .map((a) => {
    return {
      [a.pathname]: a,
    };
  })
  .reduce((a, b) => {
    return {
      ...a,
      ...b,
    };
  }, {});

type PageKeysType<T extends OriginalRouteConfigure, K = keyof T> = K extends keyof T & (string | number)
  ? `${K}` | (T[K] extends object ? `${K}.${PageKeysType<T[K]["children"]>}` : never)
  : never;
export type PathnameKey = string;
export type PageKeys = PageKeysType<typeof configure>;
export type RouteConfig = {
  /** 使用该值定位唯一 route/page */
  name: PageKeys;
  title: string;
  pathname: PathnameKey;
  parent: {
    name: string;
  };
  // component: unknown;
};
type OriginalRouteConfigure = Record<
  PathnameKey,
  {
    title: string;
    pathname: string;
    children: OriginalRouteConfigure;
    // component: unknown;
  }
>;
