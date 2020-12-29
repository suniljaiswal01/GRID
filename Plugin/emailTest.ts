
import { Startup } from "../Startup/Startup";
import { logger } from "../Logger/logger";
import { GlobalVariables } from "../../../eProc/dataCreation/GlobalVariables";
var htmlParser = require("html-to-text");
var simpleParser = require('mailparser').simpleParser;
var Imap = require('imap');
var MailParser = require("mailparser").MailParser;
var inspect = require('util').inspect;
let emailBody: any;
let from: any;
let to: any;
let subject: any;
let cc: any;

export class EmailTest_Original {
    static async openInbox(Inbox: any, imap: any, cb: any) {
        imap.openBox(Inbox, true, cb);
    }

    static async    readEmail(email: string, password: string, parameter: string[], value: string[], InboxValue: string, delay: number) {
        return new Promise((resolve, reject) => {


            let result: boolean = false;
            let imap = new Imap({
                user: email,
                password: password,
                host: 'outlook.office365.com',
                port: 993,
                tls: true,
                connTimeout: 30000
            });
            imap.connect();
            imap.once('ready', async function () {
                await EmailTest_Original.openInbox(InboxValue, imap, async function (err: any, box: any) {
                    if (err) {
                        reject("error while opening mailbox ")
                    };
                    let searchCondition = new Array();
                    var yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
                    var fievLessMin = new Date(new Date().getTime() - (1 * 5 * 60 * 1000));

                    // if (parameter.includes("ON")) {
                    //     searchCondition.push(new Array('ON', value[parameter.indexOf("ON")]));
                    // }
                    // else if (parameter.includes("SINCE")) {
                    //     searchCondition.push(new Array('SINCE', value[parameter.indexOf("SINCE")]));
                    // }
                    // else {
                    //     searchCondition.push(new Array('SINCE', fievLessMin.toString()));
                    // }

                    for (let i = 0; i < parameter.length; i++) {
                        switch (parameter[i]) {
                            case 'SUBJECT':
                                searchCondition.push(new Array("SUBJECT", value[i]));
                                break;
                            case 'FROM':
                                searchCondition.push(new Array("FROM", value[i]));
                                break;
                            case 'TO':
                                searchCondition.push(new Array("TO", value[i]));
                                break;
                            case 'SINCE':
                                searchCondition.push(new Array("SINCE", value[i]));
                                break;
                            case 'ON':
                                searchCondition.push(new Array("ON", value[i]));
                                break;
                            case 'BODY':
                                searchCondition.push(new Array("BODY", value[i]))
                        }
                    }

                    console.log(searchCondition)
                    await EmailTest_Original.delay(delay).then(async function () {

                        imap.search(searchCondition, async function (err: any, results: any) {
                            if (results.length > 1) {
                                imap.end();
                                reject("Unique email not found, please put unique condition")
                            }
                            if (!results || results.length == 0) {
                                console.log("No unseen email available");
                                imap.end();
                                reject("No records found")
                            }
                            if (results.length === 1) {
                                console.log("in else " + results.length)
                                let f: any;
                                f = imap.fetch(results, { bodies: ['HEADER', 'TEXT'] });


                                f.on('message', async function (msg: any, seqno: any) {

                                    console.log("Processing msg #" + seqno);

                                    var parser = new MailParser();
                                    parser.on('data', async (data: any) => {
                                        console.log(seqno);
                                        emailBody = data.html;
                                        emailBody = htmlParser.fromString(emailBody);
                                        emailBody = emailBody.replace(/(\n)/gm, "")

                                        Startup.email_Test.set("emailBody", emailBody)
                                        console.log("body    " + Startup.email_Test.get("emailBody"))
                                        let linkPattern: any = /(https?:\/\/+)([A-Z a-z \d]*[\- \. \# \/ \- \_ \? \= \! \@ \$ \% \& \* \( \) \+ \:]?[A-Z a-z \d]*)*/gm;
                                        let linkArray: any = new Array();
                                        if (!(emailBody.match(linkPattern) === null)) {
                                            (emailBody.match(linkPattern)).forEach(async (l: any) => {
                                                if (!(l.includes("gif") || l.includes("png"))) {
                                                    linkArray.push(l)
                                                    Startup.email_Test.set("links", linkArray)
                                                    GlobalVariables.linkArray = linkArray;
                                                }
                                            })
                                        }


                                        if (Startup.email_Test.get("subject").includes("Fw:")) {
                                            let fromPattern: any = /(?<=From:)\s([A-Z a-z \d]*[\.\-\_\@\,\<\>\;]?[A-Z a-z \d]*)*/gm;
                                            let toPattern: any = /(?<=To:)\s([A-Z a-z \d]*[\.\-\_\@\,\<\>\;]?[A-Z a-z \d]*)*/gm;
                                            let ccPattern: any = /(?<=Cc:)\s([A-Z a-z \d]*[\.\-\_\@\,\<\>\;]?[A-Z a-z \d]*)*/gm;

                                            from = emailBody.match(fromPattern)
                                            to = emailBody.match(toPattern)
                                            cc = emailBody.match(ccPattern)

                                            let toArray: any = new Array();
                                            to.forEach(async (recepients: any) => {
                                                let toJson: any = {
                                                    "address": ((recepients.split("<")[1]).split(">"))[0],
                                                    "name": (recepients.split("<")[0])
                                                }
                                                toArray.push(toJson)
                                                Startup.email_Test.set("to", toArray)
                                            });

                                            let fromArray: any = new Array();
                                            from.forEach(async (f1: any) => {
                                                let fromJson: any = {
                                                    "address": ((f1.split("<")[1]).split(">"))[0],
                                                    "name": (f1.split("<")[0])
                                                }
                                                fromArray.push(fromJson)
                                                Startup.email_Test.set("from", fromArray)
                                            });

                                            if (cc !== null) {
                                                let ccArray: any = new Array();
                                                cc.forEach(async (c1: any) => {
                                                    let ccJson: any = {
                                                        "address": ((c1.split("<")[1]).split(">"))[0],
                                                        "name": (c1.split("<")[0])
                                                    }
                                                    ccArray.push(ccJson)
                                                    Startup.email_Test.set("cc", ccArray)
                                                });
                                            }
                                        }
                                        resolve(Startup.email_Test)
                                    });
                                    parser.on('headers', (headers: any) => {

                                        subject = (headers.get('subject'));
                                        Startup.email_Test.set("subject", subject)

                                        to = (headers.get('to').value);
                                        let toArray: any = new Array();
                                        to.forEach(async (recepients: any) => {
                                            toArray.push(recepients)
                                        });
                                        Startup.email_Test.set("to", toArray)

                                        from = (headers.get('from').value);
                                        let fromArray: any = new Array();
                                        from.forEach(async (f1: any) => {
                                            fromArray.push(f1)
                                        });
                                        Startup.email_Test.set("from", fromArray)

                                        console.log(Startup.email_Test.get("subject"))
                                        console.log(Startup.email_Test.get("to"))
                                        console.log(Startup.email_Test.get("from"))
                                    });

                                    msg.on("body", async function (stream: any) {
                                        stream.once("data", async function (chunk: any) {
                                            parser.write(chunk.toString("utf8"));
                                        });

                                    });
                                    msg.once("end", async function () {
                                        parser.end();
                                    });
                                });
                                f.once('end', async function () {

                                    console.log('Done fetching all messages!');
                                    imap.end();
                                });
                            }
                        })
                    })
                })
            });
        })
    }

    static async verifyDetails(verificationKey: string, verificationData: any) {
        console.log("verify ==============================" + verificationKey)
        //    verification block
        switch (verificationKey) {
            case "BODY":
                console.log("body verification    " + emailBody.includes(verificationData))
                return (Startup.email_Test.get("emailBody") as string).includes(verificationData)
                break;
            case "SUBJECT":
                console.log("subject verification    " + subject.includes(verificationData))
                return (Startup.email_Test.get("subject") as string).includes(verificationData)
                break;
            case "TO":
                console.log("to verification    " + Startup.email_Test.get("to").some(c => (c.name).includes(verificationData)))
                return Startup.email_Test.get("to").some(c => (c.name).includes(verificationData))
                break;
            case "FROM":
                console.log("from verification    " + Startup.email_Test.get("from").some(c => (c.name).includes(verificationData)))
                return Startup.email_Test.get("from").some(c => (c.name).includes(verificationData))
                break;
            case "CC":
                console.log("from verification    " + Startup.email_Test.get("cc").some(c => (c.name).includes(verificationData)))
                return Startup.email_Test.get("cc").some(c => (c.name).includes(verificationData))
                break;
        }
    }

    static verifyDetailsArray(verificationKey: string, verificationData: any[]) {
        console.log("verify ==============================" + verificationKey)
        return new Promise((resolve, reject) => {
            let flag: boolean = true;
            switch (verificationKey) {
                case "TO":
                    if (verificationData.length === Startup.email_Test.get("to").length) {
                        verificationData.forEach(async (vD) => {
                            if (!(Startup.email_Test.get("to").some(c => (c.name).includes(vD)))) {
                                flag = false;
                            }
                        })
                        resolve(flag);
                    }
                    else {
                        reject("The list does not match in count with the actual list");
                    }
                    break;
                case "FROM":

                    if (verificationData.length === Startup.email_Test.get("from").length) {
                        verificationData.forEach(async (vD) => {
                            if (!(Startup.email_Test.get("from").some(c => (c.name).includes(vD)))) {
                                flag = false;
                            }
                        })
                        resolve(flag);
                    }
                    else {
                        reject("The list does not match in count with the actual list");
                    }
                    break;

                case "CC":
                    if (verificationData.length === Startup.email_Test.get("cc").length) {
                        verificationData.forEach(async (vD) => {
                            if (!(Startup.email_Test.get("cc").some(c => (c.name).includes(vD)))) {
                                flag = false;
                            }
                        })
                        resolve(flag);
                    }
                    else {
                        reject("The list does not match in count with the actual list");
                    }
                    break;
            }
        })
    }

    static async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}