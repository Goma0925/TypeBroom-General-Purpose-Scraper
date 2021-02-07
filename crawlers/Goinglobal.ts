import * as pupperteer from "puppeteer";
import { Job } from "../typebroom/Job";
import { TypeBroom } from "../typebroom/TypeBroom";
import { Report } from "../typebroom/Report";
import { PageScanner } from "../typebroom/PageScanner";
import { recordJobData } from "../utils/OutputHandler";
import { isEnglish } from "../utils/LanguageDetection";
import { JobData } from "./crawler-utils/JobCrawlerUtils";

class Navigator extends PageScanner{
  async scan(page: pupperteer.Page, scanParam: any){
    return {jobQueue:[scanParam.firstJob]};
  }
}

class GoingGlobalJobScanner extends PageScanner{
  async scan(page: pupperteer.Page, scanParam: any){
      // Get the job descript
      var description: string = "Job description could not be found.";
      try{
        const descriptionSelector = "body";
        description = await page.$eval(
          descriptionSelector,
          div => div.outerHTML
        );
      }catch(e){console.log("Job description could not be found.");}

      // Get the company name
      var company = scanParam.company != null ? scanParam.company: "Unknown";

      // Get the job title
      var title = scanParam.title != null ? scanParam.title: "Unknown";

      // Get country
      var country = scanParam.country != null? scanParam.country: "Unknown";

      // Get the job posting URL
      const url = page.url();

      var data: JobData = {
        title: title,
        company: company,
        country: country,
        content: description,
        url: url
      }
      console.log("Job:", data.title );
      console.log("Company:", data.company);
      console.log("Country", data.country);
      return {jobQueue: jobQueue, data: data};
  };

  async save(report: Report){
    var data: JobData = report.data;
    if (isEnglish(data.content)){
      recordJobData("goinglobal.html", data.title, data.company, data.country, data.content, data.url);
    }
  }
};
var pageScanner = new GoingGlobalJobScanner();

class GoingGlobalListScanner extends PageScanner{
  domain: string = "https://online.goinglobal.com";
  jobPageLoadPref: "load" | "domcontentloaded" | "networkidle0" | "networkidle2" = "load";
  async scan(page: pupperteer.Page, scanParam: any){
    var self:GoingGlobalListScanner = this;

    console.log("Scanning...");
    // Get the job page links
    var anchorSelector = ".job-search-listing > .job-title > a";
    var jobLinks = await page.$$eval(
      anchorSelector,
      anchors => anchors.map(a => a.getAttribute("href"))
    ); 

    // Get the company & location text
    var jobTitles = await page.$$eval(
      anchorSelector,
      anchors => anchors.map(a => a.innerHTML)
    ); 

    // Get the titles 
    var metaSelector = ".job-search-listing > .job-meta"
    var companies = await page.$$eval(
      metaSelector,
      divs => divs.map(div => div.innerHTML)
    ); 

    // Create crawl jobs for individual job postings
    var jobQueue: Job[] = [];
    for (var i=0; i<jobLinks.length; i++){
      var link:string | null = jobLinks[i];
      // console.log("Link:", self.domain + link);
      if (link != null){
        var newScanParam:any = {...{title: jobTitles[i], company: companies[i]}, ...scanParam};
        console.log("newScanParam", newScanParam);
        
        const job = {url: link, scanner: pageScanner, scanParam: newScanParam, options:{waitUntil:self.jobPageLoadPref}};
        jobQueue.push(job);
      }
    };

    // Add the next listing page
    try{
      var nextPageAnchorSelector = ".pager-next > a";
      var listPageLink = await page.$eval(
        nextPageAnchorSelector, 
        anchor => anchor.getAttribute("href")
      );
      if (listPageLink != null){
        jobQueue.push({url: listPageLink, scanner: self, scanParam: scanParam})
      }
      console.log("Next page: ", listPageLink);
    }catch{
      console.log("Could not find the next listing page.");
    }
    
    // Return job queue.
    return {jobQueue: jobQueue};
  };
}
var listScanner = new GoingGlobalListScanner();

var defaultLoadPreference: "load" | "domcontentloaded" | "networkidle0" | "networkidle2" = "networkidle0";
export var jobQueue = [
  { // Go to the main page before executing the first job.
    url:"https://online.goinglobal.com", 
    scanner: new Navigator(), 
  },
  { //Junior software engineer near Munich.
    url:"https://online.goinglobal.com/jobs/results?search%5Bremote%5D=0&search%5Bkeywords%5D=Junior+Software+engineer&search%5Boccupation%5D=&search%5Bradius%5D=100&search%5Bcountry%5D=de&search%5Blocation%5D=Munich&search%5Bfromage%5D=15&search%5Blanguage%5D=en&op=Search";
    scanner: listScanner, 
    options:{waitUntil: defaultLoadPreference}, 
    scanParam: {country: "Germany"}
  },
  { //Junior software engineer in Switzerland.
    url:"https://online.goinglobal.com/jobs/results?search%5Bremote%5D=0&search%5Bkeywords%5D=Junior+Software+engineer&search%5Boccupation%5D=&search%5Bradius%5D=100&search%5Bcountry%5D=ch&search%5Blocation%5D=&search%5Bfromage%5D=15&search%5Blanguage%5D=en&op=Search";
    scanner: listScanner, 
    scanParam: {country: "Switzerland"}
  }
];
