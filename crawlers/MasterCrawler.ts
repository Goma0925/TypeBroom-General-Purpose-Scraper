import * as xing from "./XingCrawler";
import * as indeedgermany from "./IndeedGermany";
import * as goinglobal from "./Goinglobal";
import { TypeBroom } from "../typebroom/TypeBroom";

var jobQueue = [...xing.jobQueue, ...indeedgermany.jobQueue, ...goinglobal.jobQueue];
console.log(jobQueue);

var tb = new TypeBroom( 
    jobQueue,
    {
      waitOnStart: false,
      headless: true,
    }
    );
  tb.start();