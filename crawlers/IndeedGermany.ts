import * as pupperteer from "puppeteer";
import { Job } from "../typebroom/Job";
import { TypeBroom } from "../typebroom/TypeBroom";
import { Report } from "../typebroom/Report";
import { PageScanner } from "../typebroom/PageScanner";
import { recordJobData } from "../utils/OutputHandler";
import { isEnglish } from "../utils/LanguageDetection";
import { JobData } from "./crawler-utils/JobCrawlerUtils";

class IndeedGermanyJobScanner extends PageScanner{
  async scan(page: pupperteer.Page, scanParam: any){
      // Get the job descript
      var description: string = "Job description could not be found.";
      try{
        const descriptionSelector = "#jobDescriptionText";
        description = await page.$eval(
          descriptionSelector,
          div => div.outerHTML
        );
      }catch(e){console.log("Job description could not be found.");}

      // Get the company name
      var company = "Unknown";
      try{
        const companySelector = "div.icl-u-lg-mr--sm.icl-u-xs-mr--xs > a";
        const company = await page.$eval(
          companySelector,
          header => header.innerHTML
        );
        console.log("Company:", company);
      }catch(e){console.log("Company name could not be found.");}


      // Get the job title
      var title = "Unknown";
      try{
        const titleSelector = ".jobsearch-JobInfoHeader-title";
        const title = await page.$eval(
          titleSelector,
          header => header.innerHTML
        )
        console.log("Title:", title);
      }catch(e){console.log("Job title could not be found.");}
      
      // Get the job posting URL
      const url = page.url();

      var data: JobData = {
        title: title,
        company: company,
        country: (scanParam != null && scanParam.country != null )? scanParam.country: "<Country>",
        content: description,
        url: url
      }
      return {jobQueue: jobQueue, data: data};
  };

  async save(report: Report){
    var data: JobData = report.data;
    if (isEnglish(data.content)){
      recordJobData("indeed-germany.html", data.title, data.company, data.country, data.content, data.url);
    }
  }
};
var pageScanner = new IndeedGermanyJobScanner();

class IndeedGermanyListScanner extends PageScanner{
  pageNum: number = 1;
  domain:string = "https://de.indeed.com";
  jobPageLoadPref: "load" | "domcontentloaded" | "networkidle0" | "networkidle2" = "load";
  async scan(page: pupperteer.Page, scanParam: any){
    var self:IndeedGermanyListScanner = this;

    console.log("Scanning...");
    var anchorSelector = ".jobtitle";
    var jobLinks = await page.$$eval(
      anchorSelector,
      anchors => anchors.map(a => a.getAttribute("href"))
    ); 
        
    // Create crawl jobs for individual job postings
    var jobQueue: Job[] = [];
    for (var i=0; i<jobLinks.length; i++){
      var link:string | null = jobLinks[i];
      // console.log("Link:", self.domain + link);
      if (link != null){
        const job = {url: self.domain + link, scanner: pageScanner, scanParam: scanParam, options:{waitUntil:self.jobPageLoadPref}};
        jobQueue.push(job);
      }
    };

    // Add the next listing page
    try{
      var nextPageAnchorSelector = "#resultsCol li:last-child > a";
      var listPageLink = await page.$eval(
        nextPageAnchorSelector, 
        anchor => anchor.getAttribute("href")
      );
      if (listPageLink != null){
        jobQueue.push({url: self.domain + listPageLink, scanner: self, scanParam: scanParam})
      }
      console.log("Next page: ",self.domain + listPageLink);
    }catch{
      console.log("Could not find the next listing page.");
    }
    
    // Return job queue.
    return {jobQueue: jobQueue};
  };
}
var listScanner = new IndeedGermanyListScanner();

var defaultLoadPreference: "load" | "domcontentloaded" | "networkidle0" | "networkidle2" = "networkidle2";
export var jobQueue = [
  {url:"https://de.indeed.com/Jobs?q=Software+Engineer&l=M%C3%BCnchen&jt=apprenticeship", scanner: listScanner, options:{waitUntil: defaultLoadPreference}, scanParam: {country: "Germany"}},
  {url:"https://de.indeed.com/Jobs?q=Software+Engineer&l=M%C3%BCnchen&jt=fulltime", scanner: listScanner, options:{waitUntil: defaultLoadPreference}, scanParam: {country: "Germany"}},
];

