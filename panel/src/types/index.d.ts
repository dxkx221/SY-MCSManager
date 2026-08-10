declare module "*.json" {
  const value: any;
  export default value;
}

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

// Build compatibility for shared daemon sources compiled through the Panel bundle.
declare module "uuid";
declare module "formidable" {
  export interface File {
    filepath: string;
    originalFilename?: string | null;
    newFilename: string;
    mimetype?: string | null;
    size: number;
    [key: string]: unknown;
  }
}
