export type SectionId = "dashboard" | "traffic" | "rules" | "settings";

export type NavigationSection = {
  id: SectionId;
  label: string;
  title: string;
  description: string;
};

export const sections: NavigationSection[] = [
  {
    id: "dashboard",
    label: "仪表盘",
    title: "本机信息仪表盘",
    description: "只读查看主机、系统、CPU、内存、磁盘和网络信息。",
  },
  {
    id: "traffic",
    label: "流量",
    title: "本地代理抓包",
    description: "启动本地回环代理，检查手动路由进来的请求元数据。",
  },
  {
    id: "rules",
    label: "请求头规则",
    title: "请求头改写规则",
    description: "为匹配的代理流量添加、替换或删除请求头。",
  },
  {
    id: "settings",
    label: "设置",
    title: "设置",
    description: "配置代理默认值、流量保留上限和隐私行为。",
  },
];
