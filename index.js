const manager = require("./scr/telegram/accountManager");
const iceberg = require("./scr/iceberg");

(async () => {
    let accounts = await manager.start_Accounts();
    for (let account in accounts){
        await iceberg.farming(accounts[account]);
    };
})();

