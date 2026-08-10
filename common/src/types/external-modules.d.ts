declare module "fs-extra" {
  const fsExtra: any;
  export = fsExtra;
}

declare module "os-utils" {
  const osUtils: {
    cpuUsage(callback: (usage: number) => void): void;
  };
  export default osUtils;
}
