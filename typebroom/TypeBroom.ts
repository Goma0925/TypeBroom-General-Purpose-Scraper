import * as puppeteer from 'puppeteer';
import * as readline from 'readline';
import { Job, JobOptions } from "./Job";
import { PageScanner } from './PageScanner';
import { Report } from './Report';
const BeautifulDom = require('beautiful-dom');

function askQuestion(query: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
};

export interface TypeBroomOptions{
    headless?: boolean;
    waitOnStart?: boolean;
    delay?: number;
};

export class TypeBroom{
    jobQueue: Job[];
    browser: puppeteer.Browser;
    pages: puppeteer.Page[];
    headless: boolean = false;
    waitOnStart: boolean = true;
    delay:number = 3000;
    constructor(jobQueue:Job[], options?:TypeBroomOptions){
        this.jobQueue = jobQueue;
        if (options != null){
            this.headless = options.headless!=null? options.headless: this.headless;
            this.waitOnStart = options.waitOnStart!=null? options.waitOnStart: this.waitOnStart;
            this.delay = options.delay != null ? options.delay : this.delay;
        }
    };

    private async initBrowser():Promise<any>{        
        this.browser = await puppeteer.launch({
            headless: this.headless,
            slowMo: 0 
        });
        // Get the first open tab page.
        this.pages = await this.browser.pages();
    };

    async start(){
        await this.initBrowser();
        if (this.waitOnStart){
            await askQuestion("Enter to start crawling:");
        }

        var page: puppeteer.Page = this.pages[0];        

        while (this.jobQueue.length > 0){
            var job: Job = this.jobQueue.shift()!; 
            var currentUrl: string = job.url;
            var scanner: PageScanner = job.scanner!;
            var jobOptions: JobOptions | undefined = job.options;
            console.log("Queue:", this.jobQueue.map(job => job.url));
            try{
                // Check the job options
                var waitUntil: "load" | "domcontentloaded" | "networkidle0" | "networkidle2" = "networkidle0";
                if (jobOptions != undefined){
                    // Login if jobOptions.credentials are specified
                    if (jobOptions.credentials != null){
                        await page.authenticate({'username':jobOptions.credentials.username, 'password': jobOptions.credentials.password});
                    };
                    //Set wait until param
                    if (jobOptions.waitUntil != null){
                        waitUntil = jobOptions.waitUntil;
                    }
                };

                // Go to the listing page and wait for it to load 
                console.log("Accessing URL:\n\t", currentUrl);
                await page.goto(currentUrl, { waitUntil: waitUntil });
                
                //Run the user custom scanner 
                var report: Report = {jobQueue: []};
                try{
                    report = await scanner.scan(page, job.scanParam);
                }catch(e){
                    console.log("Error scanning:", e); 
                }
    
                // Save the data in a user defined function in Scanner.
                scanner.save(report);
    
                // Add the jobQueue from scanner to the main queue.
                this.jobQueue = this.jobQueue.concat(report.jobQueue);
            }catch(e){
                console.log("Failed to scrape:", job.url);
                console.log("Error:\n", e);  
            }
            // Wait for before scraping next page
            await new Promise(resolve => {
                setTimeout(resolve, this.delay)
            })
        };
        this.browser.close();
    }
};