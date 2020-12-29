/* eslint-disable dd-eslint-rules/i18nUtil-LMT-automation-component-adoption */
/* eslint-disable dd-eslint-rules/Actionbot-automation-component-adoption */
/* eslint-disable dd-eslint-rules/Startup-automation-component-adoption */
/* eslint-disable dd-eslint-rules/dd-cc-zycus-automation-component-adoption */
module.exports = (files, chunks) => {
  const arrrayOfChunks = [];
  let totalScenarios = 0;
  const filesMap = new Map();
  let grepp = ``;
  if (process.env.GREP_EXPRESSION === undefined) {
    process.argv.forEach((element) => {
      if (element.includes(`@`)) {
        console.log(element); grepp = element;
      }
    });
  } else {
    grepp = process.env.GREP_EXPRESSION;
  }
  for (let i = 0; i <= files.length; i++) {
    if (files[i] !== undefined) {
      const fill = files[i] + ``;
      const JFile = require(`jfile`);
      const txtFile = new JFile(fill);
      const result = txtFile.grep(grepp);
      if (result.length) {
        filesMap.set(files[i], result.length);
        totalScenarios = totalScenarios + result.length;
      }
    }
  }
  filesMap[Symbol.iterator] = function* () {
    yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
  };

  const totalFiles = filesMap.size;
  console.log(`totalFiles   : ` + totalFiles);
  let counts = 1;
  const chunksCount = process.env.CHUNKS || chunks;
  let flg = false;
  let indexx = 0; // index of nested array data
  console.log(`avg : ` + totalScenarios / chunksCount);
  for (const [key, value] of filesMap) {
    console.log(key + `---------->` + value);
    if (counts <= chunksCount) {
      if (flg === false) {
        const chunkArray = []; chunkArray[indexx] = key; arrrayOfChunks[counts] = chunkArray; counts++;
        if (counts > chunksCount) {
          counts = chunksCount; flg = true; indexx++;
        }
      } else {
        arrrayOfChunks[counts][indexx] = key;
        counts--;
        if (counts === 0) {
          counts = chunksCount; indexx++;
        }
      }
    }
  }
  console.log(arrrayOfChunks);
  return arrrayOfChunks;
};
