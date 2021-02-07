import BeautifulDom from "beautiful-dom";
import * as puppeteer from "puppeteer";
import { Report } from "./Report";

export abstract class PageScanner{
    async scan(page: puppeteer.Page, scanParam?: any): Promise<Report> {return {jobQueue:[]}};
    async save(report: Report): Promise<void>{};
}