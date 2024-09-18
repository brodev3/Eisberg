const manager = require("./scr/telegram/accountManager");
const iceberg = require("./scr/iceberg");

(async () => {
    let accounts = await manager.start_Accounts();
    for (let account in accounts){
        setTimeout(iceberg.farming, (Math.floor(Math.random() * (20 - 2 + 1)) + 2) * 60_000, accounts[account]);

    };
})();

