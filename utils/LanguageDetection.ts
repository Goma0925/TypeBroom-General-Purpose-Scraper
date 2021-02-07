const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();

export function isEnglish(text: string){
  const possibleLangs = lngDetector.detect(text);
  var isTrue = false;
  var lang = "";
  possibleLangs.forEach((item:any, i:any) => {
    lang = item[0];
    if (lang == "english"){
      if (i == 0 || i == 1){
        isTrue = true;
      }
    }
  });
  return isTrue;
}
