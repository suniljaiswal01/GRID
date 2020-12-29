
const fetch = require("node-fetch");


export class Jiralogger{

static async logJira(ScenarioName : string, FeatureName : string , errorStack : string){

const bodyData = `{
    "fields": {
       "project":
       {
          "key": "DDS"
       },
       "summary": "`+ScenarioName+` SCENARIO has failed from FEATURE `+FeatureName+`",
       "components":[{"name": "`+process.env.PRODUCT_COMPONENT+`"}],
       "assignee": {"name": "`+process.env.ASSIGNEE+`"},
       "description": "`+((errorStack.replace(/\\/g,"\\\\")).replace(/\"/g, "\\\"")).replace(/\n/g,"")+`",
       "issuetype": {
          "name": "Bug"
       },
       "customfield_10128": { "value": "`+process.env.PRODUCT+`" },
       "customfield_15709": { "value": "`+process.env.PRIORITY+`" },
       "customfield_15606": { "value": "`+process.env.SEVERITY+`" },
       "customfield_16203": { "value": "Yes" }
   }
} `;
console.log(bodyData)
fetch('https://pdtzycus.atlassian.net/rest/api/2/issue', {
  method: 'POST',
  headers: {
    // 'Authorization': `Basic cnVzaGFiaC5zaGFoQHp5Y3VzLmNvbTowYlVhMGNJN3oxR3h2SlR5V0ZqTEM1NDA`,
    'Authorization': `Basic SklSQS1ib3R1c2VyQHp5Y3VzLmNvbTpRbnhXTVRKd0pQc0Q4aGpNMFdoVjlENTM=`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: bodyData
})
  .then(async function(response : any) {
    console.log(
      `Response: ${response.status} ${response.statusText}`
    );
    return response.text();
  })
  .then(async function(text : any){ console.log(text)})
  .catch(async function(err : any){console.error(err)});

}
}
