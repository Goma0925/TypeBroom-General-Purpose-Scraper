import { PageScanner } from "./PageScanner";
interface Credentials{
    username: string;
    password: string;
}

export interface JobOptions{
    waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
    interval?:number;
    credentials?: Credentials;
};

export interface Job{
    url: string;
    scanner: PageScanner;
    options?: JobOptions;
    scanParam?: any;
}