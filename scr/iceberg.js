const log = require("./utils/logger");
const telegram = require("./telegram/telegram");
const axiosRetry = require("./utils/axiosRetryer");
const notion = require('./utils/notion');

async function delay(delayTime) {
    return new Promise(resolve => setTimeout(resolve, delayTime)); 
};

async function auth(Account){
    try {
        let TgWebData = await telegram.get_TgWebData(Account.client);
        Account.axios.defaults.headers.common['X-Telegram-Auth'] = TgWebData;
    }
    catch (err){
        log.error(`Account: ${Account.username} ` + err);
    };
};

async function getBalance(Account){
    try {
        let resp = await axiosRetry.get(Account.axios, "https://0xiceberg.com/api/v1/web-app/balance/");
        return resp.data.amount;
    }
    catch (err){
        log.error(`Account: ${Account.username} ` + err);
    };
};

async function tasks(Account){
    try {
        let resp = await axiosRetry.get(Account.axios, "https://0xiceberg.com/api/v1/web-app/tasks/");
        let tasksArr = resp.data;
        for (let i = 0; i < tasksArr.length; i++){
            let des = tasksArr[i].description;
            if (des.includes('friends') || des.includes('Upgrade') || des.includes('Moneyviber') || des.includes('Подпишитесь'))
                continue;
            let status = tasksArr[i].status;
            if (status == "new")
                return task(Account, tasksArr[i].id, {status: "in_work"});
            if (status == "in_work")
                return task(Account, tasksArr[i].id, {status: "ready_collect"});
            if (status == "ready_collect")
                return task(Account, tasksArr[i].id, {status: "collected"});
        };
        return log.info(`Account ${Account.username} | Tasks complete!`);
    }
    catch (err){
        log.error(`Account: ${Account.username} ` + err);
    };
};

async function task(Account, id, status){
    try {
        let resp = await axiosRetry.patch(Account.axios, `https://0xiceberg.com/api/v1/web-app/tasks/task/${id}/`, status);
        await delay(Math.floor(Math.random() * (30 - 5 + 1)) + 5);
        await tasks(Account);
        return;
    }
    catch (err){
        log.error(`Account: ${Account.username} ` + err);
    };
};

async function claim(Account){
    try {
        let resp = await axiosRetry.DELETE(Account.axios, "https://0xiceberg.com/api/v1/web-app/farming/collect/", null);
        await start(Account);
        let balance =  await getBalance(Account);
        return balance;
    }
    catch (err){
        log.error(`Account: ${Account.username} ` + err);
    };
};

async function start(Account){
    try {
        let resp = await axiosRetry.post(Account.axios, "https://0xiceberg.com/api/v1/web-app/farming/", {});
        let stop_time = resp.data.stop_time;
        let stop_timestamp = Date.parse(stop_time);
        return stop_timestamp;
    }
    catch (err){
        log.error(`Account: ${Account.username} ` + err);
    };
};

async function farming(Account){
    try {
        await Account.connect();
        await auth(Account);
        let stop_timestamp = await start(Account);
        let balance = await getBalance(Account);
        log.info(`Account ${Account.username} | Started! Balance: ${balance}`);
        await notion.findAndUpdatePage("Brothers", Account.username, "Iceberg | Points", +balance);
        // await tasks(Account);
        let now = Date.now();
        if (stop_timestamp <= now){
            balance = await claim(Account);
            let stop_timestamp = await start(Account);
            setTimeout(farming, (Math.floor(Math.random() * (395 - 361 + 1)) + 361) * 60000, Account);
            log.info(`Account ${Account.username} | Claimed reward! Balance: ${balance}`);
            await notion.findAndUpdatePage("Brothers", Account.username, "Iceberg | Points", +balance);
        } 
        else {
            setTimeout(farming, (stop_timestamp + (Math.floor(Math.random() * (30 - 2 + 1)) + 2) * 60000 - now), Account);
            log.info(`Account ${Account.username} | Waiting claim...`);
        };
        setTimeout(telegram.disconnect, 30000, Account.client);
        return;
    }
    catch (err){
        log.error(`Account ${Account.username} | Error: ${err}`);
    };
}

module.exports.farming = farming;





