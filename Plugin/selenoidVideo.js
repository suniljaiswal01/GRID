/* eslint-disable require-jsdoc */
/* eslint-disable dd-eslint-rules/Startup-automation-component-adoption */
/* eslint-disable dd-eslint-rules/i18nUtil-LMT-automation-component-adoption */
/* eslint-disable dd-eslint-rules/dd-cc-zycus-automation-component-adoption */
/* eslint-disable dd-eslint-rules/Actionbot-automation-component-adoption */
// eslint-disable-next-line dd-eslint-rules/dd-cc-zycus-automation-component-adoption
// eslint-disable-next-line dd-eslint-rules/Startup-automation-component-adoption

const axios = require(`axios`).default;
const fs = require(`fs`);
const path = require('path');
const xml2js = require(`xml2js`);
const { clearString } = require(`codeceptjs/lib/utils`);
const {
  container, event, recorder, output,
} = require(`codeceptjs/lib/index`);

const supportedHelpers = [`WebDriver`];

const failedTests = [];
const passedTests = [];
const wait = (time) => new Promise((res) => setTimeout(() => res(), time));

const selenoid = (config) => {
  const helpers = container.helpers();
  let helperName;

  for (const name of supportedHelpers) {
    if (Object.keys(helpers).indexOf(name) > -1) {
      helperName = name;
    }
  }

  if (!helperName) {
    output.print(`Selenoid plugin supported only for: ${supportedHelpers.toString()}`);
    return; // no helpers for Selenoid
  }

  recorder.startUnlessRunning();

  event.dispatcher.on(event.test.before, (test) => {
    switch (helperName) {
      case `WebDriver`: setTestConfigForWebdriver(test); break;
    }
  });

  event.dispatcher.on(event.all.after, async () => {
    await wait(20000);
    await videoSaved(failedTests);
    await deletePassedTests(passedTests);
    await deletePassedTests(failedTests);
  });

  event.dispatcher.on(event.test.passed, async (test) => {
    const machineip = await getHostIp();
    const details = {
      title: test.title,
      ip: machineip,
    };
    passedTests.push(details);
  });

  event.dispatcher.on(event.test.failed, async (test) => {
    const machineip = await getHostIp();
    const details = {
      title: test.title,
      path: global.output_dir,
      ip: machineip,
    };
    console.log(`Details:`, details);
    failedTests.push(details);
  });
};

module.exports = selenoid;

async function videoSaved(failedTests) {
  for (const test of failedTests) {
    const fileName = `${clearString(test.title)}.mp4`;
    try {
      await downloadVideo(test.ip, fileName, test.path);
      await editXML(test, fileName);
    } catch (error) {
      console.log("Unable To Download video :", fileName, " from ip :", test.ip)
    }

  }
}

function deletePassedTests(passedTests) {

  for (const test of passedTests) {
    const fileName = clearString(test.title);
    try {
      axios.delete(`${test.ip}/video/${fileName}.mp4`);
    } catch (error) {
      console.log("Unable To Delete File :", fileName, " from ip :", test.ip);
    }

  }
}

function setTestConfigForWebdriver(test) {
  const WebDriver = container.helpers(`WebDriver`);
  const fileName = clearString(test.title);
  const { options } = WebDriver;
  recorder.add(`setting selenoid capabilities`, () => {
    options.capabilities[`selenoid:options`].name = test.title;
    options.capabilities[`selenoid:options`].videoName = `${fileName}.mp4`;
    options.capabilities[`selenoid:options`].logName = `${fileName}.log`;
  });
}

async function getHostIp() {
  const WebDriver = container.helpers(`WebDriver`);

  const ggrPort = WebDriver.config.port;
  const ggrHost = WebDriver.config.host;

  const sessions = WebDriver.browser;

  // SELENOID_HOST - ggr machien ip and port
  const res = await axios.get(`http://${ggrHost}:${ggrPort}/host/${sessions.sessionId}`);

  const ipAdress = res.data[`Name`];
  const port = res.data[`Port`];

  return `http://` + ipAdress + `:` + port;
}

async function downloadVideo(selenoidIp, fileName, output_dir) {
  const url = `${selenoidIp}/video/${fileName}`;
  const path = `${output_dir}/${fileName}`;

  const writer = fs.createWriteStream(path);
  const response = await axios({
    url,
    method: `GET`,
    responseType: `stream`,
  });

  response.data.pipe(writer);

  output.debug(`Video has been saved to file://${path}`);
  return new Promise((resolve, reject) => {
    writer.on(`finish`, resolve);
    writer.on(`error`, reject);
  });
}

function updateXML(videoPath, videoFile, name, xmlFile) {
  fs.readFile(xmlFile, `utf-8`, (err, data) => {
    if (err) {
      throw err;
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;

    const videoAttachent = {
      $: {
        "title": `Failure Video`,
        "source": videoFile,
        "type": `video/mp4`,
        "size": fileSize,
      },
    };

    // convert XML data to JSON object
    xml2js.parseString(data, (err, result) => {
      if (err) {
        throw err;
      } else {
        for (const iterator of result[`ns2:test-suite`][`test-cases`]) {
          for (const test of iterator[`test-case`]) {
            if (test.name[0] == name) {
              test.attachments[0].attachment[1] = videoAttachent;
              const builder = new xml2js.Builder();
              data = builder.buildObject(result);
              fs.unlinkSync(xmlFile);

              // write updated XML string to a file
              fs.writeFile(xmlFile, data, (err) => {
                if (err) {
                  throw err;
                }
                console.log(`Updated XML is written to a new file.`);
              });
            }
          }
        }
      }
    });
  });
}
function editXML(testDetails, fileName) {

  const videoPath = path.join(testDetails.path, fileName)

  fs.readdir(testDetails.path, async function (err, files) {
    // handling error
    if (err) {
      return console.log(`Unable to scan directory: ` + err);
    }
    const extension = `xml`;
    const xmlFiles = files.filter((file) => file.match(new RegExp(`.*\.(${extension})`, `ig`)));
    // listing all files using forEach
    for (const file of xmlFiles) {
      const xmlPath = path.join(testDetails.path, file)
      await updateXML(videoPath, fileName, testDetails.title, xmlPath);
    }
  });
}
