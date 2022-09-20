const puppeteer = require("puppeteer");
const readlineSync = require("readline-sync");
const fs = require("fs");

(async () => {
  var tweetLink = readlineSync.question("Link tweet : ");
  var tweetWord = readlineSync.question("Word : ");
  let folTargetFirst = tweetLink.split("/");

  const userList = fs.readFileSync("./user.txt", "utf-8");
  const userListArray = userList.split("\n");

  const taguserList = fs.readFileSync("./taguser.txt", "utf-8");
  const taguserListArray = taguserList.split("\n");

  let usernameList = [];
  let passwordList = [];
  for (let i = 0; i < userListArray.length; i++) {
    usernameList[i] = userListArray[i].split("|")[0];
    passwordList[i] = userListArray[i].split("|")[1];
  }

  // >COLLECTING_USER_MENTIONED
  let folTargetMention = [];
  let folTargetMentionArray = [];
  let folTargetMentionArrayFix = [];
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(tweetLink, { waitUntil: "networkidle2" });

  const results = await page.$$eval("article div[lang]", (tweets) =>
    tweets.map((tweet) => tweet.textContent)
  );

  folTargetMention = results[0].replaceAll("\n", " ").split(" ");
  folTargetMentionArray = folTargetMention.filter((item) => item.includes("@"));
  folTargetMentionArrayFix = folTargetMentionArray
    .toString()
    .replaceAll("@", "")
    .split(",");

  browser.close();
  // COLLECTING_USER_MENTIONED

  for (let i = 0; i < userListArray.length; i++) {
    let tagRandom = [];
    const options = { waitUntil: "networkidle2" };
    const browser = await puppeteer.launch({ headless: false, slowMo: 10 });
    const page = await browser.newPage();
    await new Promise((r) => setTimeout(r, 2000));

    // >GENERATE_RANDOM_TAG
    for (let j = 0; j < 3; j++) {
      tagRandom[j] = taguserListArray[3 * i + j];
    }
    // GENERATE_RANDOM_TAG

    // >LOGIN
    await page.goto("https://twitter.com/i/flow/login", {
      waitUntil: "networkidle2",
    });
    const emailField = await page.$("input[name=text]");
    await emailField.type(usernameList[i]);
    await page.keyboard.press("Enter");
    await emailField.dispose();

    await new Promise((r) => setTimeout(r, 2000));

    const passField = await page.$("input[name=password]");
    await passField.type(passwordList[i]);
    await page.keyboard.press("Enter");
    await passField.dispose();

    await new Promise((r) => setTimeout(r, 2000));
    // LOGIN

    // >LOGIN_CHECK
    if (page.url() == "https://twitter.com/home") {
      console.log(`Log in akun ke ${i + 1} sukses`);
    } else {
      process.exit(1);
    }
    // LOGIN_CHECK

    // >TASK
    await page.goto(tweetLink, {
      waitUntil: "networkidle2",
    });

    await new Promise((r) => setTimeout(r, 1000));

    // $LIKE
    const likeBtn = await page.$("div[aria-label=Like]"); // change "Like" into your twitter system language
    await likeBtn.click();
    await likeBtn.dispose();
    console.log("Like Berhasil");

    await new Promise((r) => setTimeout(r, 1000));

    //*REPLY
    const replyWrite = await page.$("div[data-testid=tweetTextarea_0]");
    await replyWrite.click();
    await replyWrite.type(
      `${tweetWord} \n @${tagRandom[i * 0]} \n @${tagRandom[i * 0 + 1]} \n @${
        tagRandom[i * 0 + 2]
      }`
    );
    await page.keyboard.down("ControlLeft");
    await page.keyboard.press("Enter");
    await page.keyboard.up("ControlLeft");
    await replyWrite.dispose();
    console.log("Reply Berhasil");

    await new Promise((r) => setTimeout(r, 1000));

    //*QUOTE_RETWEET
    const optionRt = await page.$("div[data-testid=retweet]");
    await optionRt.click();
    await optionRt.dispose();

    await new Promise((r) => setTimeout(r, 1000));

    const [qtBtn] = await page.$x("//span[contains(., 'Quote Tweet')]"); // change "Quote Tweet" into your twitter system language
    await qtBtn.click();
    await qtBtn.dispose();

    const qtWrite = await page.$("div.DraftEditor-root");
    await qtWrite.click("div.DraftEditor-root");
    await qtWrite.type(
      `${tweetWord} \n @${tagRandom[i * 0]} \n @${tagRandom[i * 0 + 1]} \n @${
        tagRandom[i * 0 + 2]
      }`
    );
    await page.keyboard.down("ControlLeft");
    await page.keyboard.press("Enter");
    await page.keyboard.up("ControlLeft");
    await qtWrite.dispose();
    console.log("Quote Retweet Berhasil");

    await new Promise((r) => setTimeout(r, 2000));

    //*GO_TO_RETWEET_RESULT
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    //*SS_RETWEET_RESULT
    await page.screenshot({
      path: `./ss/screenshot${i + 1}.png`,
      fullPage: true,
    });
    console.log("Berhasil Screenshot");

    //*WRITE_RETWEET_LINK_RESULT_TO_TXT
    fs.appendFile("linkresult.txt", `${page.url()}\n`, function (err) {
      if (err) throw err;
      console.log("Link Saved!");
    });

    await new Promise((r) => setTimeout(r, 1000));

    //*FOLLOW_USER_THAT_MAKE_THE_TWEET
    await page.goto(
      `https://twitter.com/intent/follow?screen_name=${folTargetFirst[3]}`,
      options
    );
    const ClickFollow = await page.$(
      "div[data-testid=confirmationSheetConfirm]"
    );
    await ClickFollow.click();
    await ClickFollow.dispose();
    console.log("Berhasil Follow User Yang di Retweet");

    await new Promise((r) => setTimeout(r, 1000));

    //*FOLLOW_USER_THAT_MENTIONED_IN_TWEET
    try {
      for (let j = 0; j < folTargetMentionArrayFix.length; j++) {
        await page.goto(
          `https://twitter.com/intent/follow?screen_name=${folTargetMentionArrayFix[j]}`,
          options
        );

        const ClickFollow = await page.$(
          "div[data-testid=confirmationSheetConfirm]"
        );
        await ClickFollow.click();
        await ClickFollow.dispose();

        await new Promise((r) => setTimeout(r, 1000));
      }
      console.log("Berhasil Follow User Yang di Mention");
    } catch (error) {
      console.log("Tidak Ada User Yang di Mention");
      await browser.close();
    }

    // TASK

    // >CLOSE_ACCOUNT
    tagRandom = [];
    await new Promise((r) => setTimeout(r, 5000));
    await browser.close();
    // CLOSE_ACCOUNT
  }

  //await browser.close();
})();
