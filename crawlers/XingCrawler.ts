import * as pupperteer from "puppeteer";
import { Job } from "../typebroom/Job";
import { TypeBroom } from "../typebroom/TypeBroom";
import { Report } from "../typebroom/Report";
import { PageScanner } from "../typebroom/PageScanner";
import { recordJobData } from "../utils/OutputHandler";
import { isEnglish } from "../utils/LanguageDetection";
import { JobData } from "./crawler-utils/JobCrawlerUtils";

function listLinkMunich(pageNum: number): string{
  return "https://www.xing.com/jobs/search?page="+pageNum+"&keywords=Software%20engineering&location=Munich&radius=70";
}

class XingJobScanner extends PageScanner{
  async scan(page: pupperteer.Page, scanParam: any){
    // Get the job descript
    var description: string = "";
    try{
      const descriptionSelector:string = ".html-description-html-description-header-085d8de8";
      description = await page.$eval(
        descriptionSelector,
        div => div.outerHTML
      )
    }catch{
      // For PDF posting.
      const pdfSelector: string = ".pdf-preview-pdf-preview-container-8f7ffad9";
      const pdfLink: string | null = await page.$eval(
        pdfSelector,
        anchor => anchor.getAttribute("href")
      );
      if (pdfLink != null){
        description = "<p>PDF Job posting can be found <a href="+pdfLink+">here</a></p>";
      }
    }

    // Get the job title
    const titleSelector = ".info-info-title-dca28754";
    const title = await page.$eval(
      titleSelector,
      header => header.innerHTML
    )
    console.log("Title:", title);

    // Get the company name
    const companySelector = "div.info-info-container-c7e5a698 > a > h2";
    const company = await page.$eval(
      companySelector,
      header => header.innerHTML
    );
    console.log("Company:", company);
    
    // Get the job posting URL
    const url = page.url();    

    var data: JobData = {
      title: title,
      company: company,
      country: scanParam.country != null? scanParam.country : "<Country>",
      content: description,
      url: url
    }
    return {jobQueue: jobQueue, data: data};
  };

  async save(report: Report){
    var data: JobData = report.data;
    if (isEnglish(data.content)){
      recordJobData("xing.html", data.title, data.company, data.country, data.content, data.url);
    }
  }
};
var pageScanner = new XingJobScanner();

class XingListScanner extends PageScanner{
  pageNum: number = 1;
  domain:string = "https://www.xing.com";
  async scan(page: pupperteer.Page, scanParam: any){
    var self:XingListScanner = this;
    var country = scanParam.coutry;

    console.log("Scanning...");
    var jobLinks = await page.$$eval(
      '.result-result-link-b656e933',
      anchors => anchors.map(a => a.getAttribute("href"))
    );   
    
    // Create crawl jobs for individual job postings
    var jobQueue: Job[] = [];
    for (var i=0; i<jobLinks.length; i++){
      var link:string | null = jobLinks[i];
      console.log("Link:", self.domain + link);
      if (link != null){
        jobQueue.push({url: self.domain + link, scanner: pageScanner, scanParam: scanParam});
      }
    };

    // Add listing next page
    self.pageNum += 1
    jobQueue.push({url: listLinkMunich(self.pageNum), scanner: self, scanParam: scanParam});
    return {jobQueue: jobQueue};
  };
}
var listScanner = new XingListScanner();

export var jobQueue = [
  {url:listLinkMunich(1), scanner: listScanner, scanParam: {country: "Germany"}}
];
