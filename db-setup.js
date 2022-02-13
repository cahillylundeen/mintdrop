//------------------IMPORTS------------------//
const sqlite3 = require("sqlite3").verbose();
const random = require("random");

//------------------CRYPTOGRAPHY_AND_RANDOM------------------//
function makeID(len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < len; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
function hash(input) {
    return createHash('sha256').update(input).digest('hex');
}
function randInt(min, max) {
    return Math.floor(Math.random() * (max + 1 - min) + min)
}

//------------------DEFINITIONS------------------//
const databaseSetup = function() {
    console.log("setup db!")
    //open db
    var db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
        if (error) return console.log(error.message);
        console.log("database connected")
    });
    //create tables
    db.run(`CREATE TABLE users(userID, profilePhoto, username, password, email)`);
    db.run(`CREATE TABLE items(name, itemID, ownerID, collectionID, mediaLink, mediaType, mintDate)`);
    db.run(`CREATE TABLE trades(tradeID, sendItemID, receiveItemID, sendUserID, receiveUserID, sendUserApproval, receieveUserApproval, completion, date)`);
    db.run(`CREATE TABLE collections(collectionID, artist, name, releaseDate)`);
    // close db
    db.close((error) => {
        if (error) return console.log(error.message);
    })
}
const createItem = function(name, ownerID, collectionID, mediaLink, mediaType) {
    console.log(`generating item!`)
    //open db
    var db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
    if (error) return console.log(error.message);
    console.log("database connected")
    });
    //define parameters
    var mintDate = new Date()
    console.log(mintDate)
    var itemID = makeID(16)
    db.run(`INSERT INTO items (name, itemID, ownerID, collectionID, mediaLink, mediaType, mintDate) VALUES(?,?,?,?,?,?,?)`,[name, itemID, ownerID, collectionID, mediaLink, mediaType, mintDate]), (error) => {
        if (error) return console.log(error.message);
    }
    // close db
    db.close((error) => {
        if (error) return console.log(error.message);
    })
}
const createCollection = function(name, artist, releaseDate, collectionID) {
    console.log("generate collection!")
    //open db
    var db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
    if (error) return console.log(error.message);
    console.log("database connected")
    });
    db.run(`INSERT INTO collections (collectionID, artist, name, releaseDate) VALUES(?,?,?,?)`,[collectionID, artist, name, releaseDate]), (error) => {
        if (error) return console.log(error.message);
    }
    //close db
    db.close((error) => {
        if (error) return console.log(error.message);
    })
}
const createTrade = function(tradeID, sendItemID, receiveItemID, sendUserID, receiveUserID, sendUserApproval, receiveUserApproval, completion, date) {
    console.log("generate trade!")
    //open db
    var db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
    if (error) return console.log(error.message);
    console.log("database connected")
    });
    if (sendUserApproval == true && receiveUserApproval == false) {
        db.run(`INSERT INTO trades (tradeID, sendItemID, receiveItemID, sendUserID, receiveUserID, sendUserApproval, receieveUserApproval, completion, date) VALUES(?,?,?,?,?,?,?,?,?)`,[tradeID, sendItemID, receiveItemID, sendUserID, receiveUserID, sendUserApproval, receiveUserApproval, completion, date]), (error) => {
            if (error) return console.log(error.message);
        }
    }
    //close db
    db.close((error) => {
        if (error) return console.log(error.message);
    })
}
const checkTrades = function() {
    console.log("check for trades!")
    //open db
    var db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
        if (error) return console.log(error.message);
        console.log("database connected")
    });
    var query = `
    SELECT tradeID, sendItemID, receiveItemID, sendUserID, receiveUserID FROM trades 
    WHERE sendUserApproval=true AND receieveUserApproval=true AND completion=false`
    db.all(query, function (error, rows) {
        if (error) return console.log(error.message);
        if (rows.length == 0) {return console.log('all trades are completed!')}
        console.log(rows)
        for (let i = 0; i < rows.length; i++) {
            let tradeID = rows[i].tradeID
            let sendItemID = rows[i].sendItemID
            let receiveItemID = rows[i].receiveItemID
            let sendUserID = rows[i].sendUserID
            let receiveUserID = rows[i].receiveUserID
            //swap sender's item for receiver's item
            db.run(`UPDATE items SET ownerID="${sendUserID}" WHERE itemID="${receiveItemID}"`)
            db.run(`UPDATE items SET ownerID="${receiveUserID}" WHERE itemID="${sendItemID}"`)
            //set date in the trades table
            let date = new Date()
            db.run(`UPDATE trades SET date="${date}" WHERE tradeID="${tradeID}"`)
            db.run(`UPDATE trades SET completion=${true} WHERE tradeID="${tradeID}"`)
            console.log('trade completed!')
        }
    })
    //close db
    db.close((error) => {
        if (error) return console.log(error.message);
    })
}

//------------------EXPORTS------------------//
exports.databaseSetup = databaseSetup
exports.createItem = createItem
exports.createCollection = createCollection
exports.createTrade = createTrade
exports.checkTrades = checkTrades

//------------------SAMPLE_ITEMS+COLLECTIONS------------------//
let explosionOfColor = [
    {"name": "Explosion of Color #85", "link": "https://lh3.googleusercontent.com/vK_ygCOYwZkRgY_dI2luFh31P4yXMLzIXe8PNpudGUoaoxq7SNUtIpWTVvmtzIX0OBzN-c4yNOtrroszwXaY2ICpNU2MziBIrb9irl4=w600"}, 
    {"name": "Explosion of Color #62", "link": "https://lh3.googleusercontent.com/F42vzQbYi5ZBtkSmog6lIk24dX1culrhhwojCfqlGS7lAwQ_YB5M8cd1f_XKkmIaAG8S8MxHiBKompFwb67eAJa-JR8Ec_qSI3C-9w=w600"},
    {"name": "Explosion of Color #94", "link": "https://lh3.googleusercontent.com/4mJU8EDwl72Co7TN4pzhNL9sfIpBEzNf_1Zm6vJuzjfClOVSuZNr5V-f5n9EIJPPiXlctAnP6RkmhL9322K-c1ODRCAq3r_KlKgj=w600"},
    {"name": "Explosion of Color #80", "link": "https://lh3.googleusercontent.com/FwEl7Nb5IMUQkW5WCMypLiLT84bc2uW1rnZZ3eWS3PDGraCUPU6-LCn8cewjDg_7HUjMDL6hdvgItixP1XxmnYDziH2zpgOl0hJVCA=w600"},
    {"name": "Explosion of Color #42", "link": "https://lh3.googleusercontent.com/5hvmPBoLvTCZ0jgxRNw2lR4sVnJvaKa4u-TYCLJ0gzBUkBCLi5RaodegLttT1iDjMi01CFD1ymrwlpTEp0MK2MunoNg-06Hlwpp3=w600"}
]
let etherBear = [
    {"name": "EtherBear #3946", "link": "https://lh3.googleusercontent.com/U22VWZHMP_3qgZMOBTqg3DEocSUkpnrbbZ1v1if9StDZQpztZvzCys8FmTnW11e4L-WT5LchAvftZAch8SdVOZMBwIfRiJ6VWo3vLQ=w600"}, 
    {"name": "EtherBear #1514", "link": "https://lh3.googleusercontent.com/rRalAJne01Br6Ri9J3s-YBSDhvYThGfz8KSi_RoAzoEmma_U-iLMj9GvpJW5ykbim_o6IivHGopeZQOoaajPWt2wCIeVBD-fU4_Zzw=w600"},
    {"name": "EtherBear #1271", "link": "https://lh3.googleusercontent.com/FtvmUqk4Xu-NrbXWJZ3LFnS89Eo5cDr6cu8xkqt4CW0PFLWFeytBsKyS3lQe8SBf4qe-F5cZjRTnXumWsdDPnU7f9FVUf6nyY8t0=w600"},
    {"name": "EtherBear #1596", "link": "https://lh3.googleusercontent.com/ugxI7LwvcudPduYuO-TxH_7a5fQRCIqF7saN5NK24wzr-4s2Oxg6L653-o5DMjLs2S9rv4CGffE4LDZC1yv4ZNvpixu4R1b3bLI5Gw=w600"},
    {"name": "EtherBear #1564", "link": "https://lh3.googleusercontent.com/Y08Zzn5YCd05o_ftB6-cZBVRAIzIdjR3ISu9nnII1vFsn_VY-OiYzTbzhA1LRudC2fsAmS94adz3Lktj3QC9KMIzgEPpNFK75qBRKA=w600"}
]
let lightAndDark = [
    {"name": "Light #24", "link": "https://lh3.googleusercontent.com/H6Sg-2e_HLhaUevvV4UFjZhOCtj1s7Q3-7TOCOG5BeQFUgXrHQUo7Kg96PSHzeOnS0NB-RYYq034luAtNiYaiEY5M-7ptE_P5Q0u-w=w600"},
    {"name": "Light #14", "link": "https://lh3.googleusercontent.com/R_nlQERHY8t48qFbB3PdECDDx8DOhAnGBu83vlKjXVR-Pk-KsLOsoSRTbk8XYMwEgVdWkMs9P6mOPBTVT1klXbU9x2Zn-gETqRE2Pw=w600"},
    {"name": "Light #34", "link": "https://lh3.googleusercontent.com/W4DRWn0cmZmuAt84Y9cQ3ULuc_DPtbUYBZZfwcKn6e195Qbp5Ygh1tVwSWVss5yfJIPIgDluTSicOMA3L9_ead6mi0KbmUXG-eCE724=w600"},
    {"name": "Light #41", "link": "https://lh3.googleusercontent.com/0eILE6UTJGEyXp5eRyTCcm_x6E2FJOaq3gzvkGHKHc43_zdbBY5Mpdqaz9WDi2pk0WlCUVXWhvowOJwNTA_GZGFy54PglFdMmihq=w600"},
    {"name": "Light #8", "link": "https://lh3.googleusercontent.com/_TdvWIGzwnwX8mYGmVcjUQtbwQpAbW8tKLK1nsUmgDU58GII3YuO6xamgDzw1AUCx1d0UuMQzUZTvY4QFPfksfTK00jtPW_JsZLJVbU=w600"}
]
let singularity = [
    {"name": "Singularity #992", "link": "https://lh3.googleusercontent.com/f7dnIE9ZFkJPwHTQJp5L13tSJZ9E1-29COwr4Iss9Na-l9vunsEnBBO_486m21vnAHh2XULoLxpt-tBdJIZtcxQBPTmjivD6VPi2=w600"},
    {"name": "Singularity #552", "link": "https://lh3.googleusercontent.com/57espY7xlFiBnhuOVsTVT1CiqbRLYY3PRIQfHlcKqi8BCGw7d2AnTj17ER2T0RqvfdObMrI7E9Euca5LFt26PdghijQaiOFP55aM=w600"},
    {"name": "Singularity #726", "link": "https://lh3.googleusercontent.com/ZTDVVcBAxap2_YR_Cj4Rhf6OmJnD1CQv9WvOwmVDl4lUvHMDoPjTnNlDy2Yc3jug0yaIiM7wt0_2Rr-t57jlQFzjQfvD7P1AO4zb=w600"},
    {"name": "Singularity #566", "link": "https://lh3.googleusercontent.com/BMMtcZAgzWY10bMiEtlXB_wSElNvJg_NIRI3s9JM61nV7NOMg8mS1uLGPCO8YqZVnN476BO3JMqVQ-UREwGFEnAD8KSjzu8NlTBc2lY=w600"},
    {"name": "Singularity #962", "link": "https://lh3.googleusercontent.com/hOe3nM-7XYv3l3C-qmsgH7iMbpxOLTAQiZM3T870GI4KCYc-SZijr-hB3Ws_fjvbld3UTeukvyh4rIA4ssyo7ItV6AdtJQlkeobA=w600"}
]
let cyberKongz = [
    {"name": "Ghost #1", "link": "https://lh3.googleusercontent.com/9-b4E-0FW1_-vILmG9ZZNbUgwBLJzdujaTF1HufPK4NawCyDdksdVL2FeSEYIU_vSWBFaLHNRweg59jXDDWro5rx9HrhrurhJXl8bQ=w600"},
    {"name": "CyberKong #2022", "link": "https://lh3.googleusercontent.com/TVYumCIRNXCeQrrx1bJPL5Z7y21CTolar5bq0_7L8Vo0x3NATtDiYrX_tA5d8bX8iRTHa6gFbSifiByJ2wbdWtR21drT0VTOy4NRCQ=w600"},    
    {"name": "CyberKong #187", "link": "https://lh3.googleusercontent.com/8RTcKJ_64arWk-ai6zDy868khAJinTFcHXGdI7d_qZdcpg_1I_iWFMvmL6MkdlZ79mKW-seCyek84eseSjTGutwJ0_eArmSrF12J0A=w600"},
    {"name": "CyberKong #128", "link": "https://lh3.googleusercontent.com/hqf4LyRSerGlCBatcZvXrvwnCPII1fAM8R2zkNSlCBtGDejCNUALmFe5NGfaOREDfBVi_cse6_cxmHhqWwgC2BEDGUj1usMMs6CQ9Q=w600"},
    {"name": "CyberKong #3687", "link": "https://lh3.googleusercontent.com/MR7ew0-3JGN2WaiEENN5xhH0_0NzWfrR5fEhz4qq7_qmr5rY8vMPIGfKcqKQrPnEdonA5GHiPxF943-TkVyWJXrNJeVPzt4VUOlttw=w600"}
]
// let undef = [
//     {"name": "", "link": ""},
//     {"name": "", "link": ""},    
//     {"name": "", "link": ""},
//     {"name": "", "link": ""},
//     {"name": "", "link": ""}
// ]
let collectionsLists = [explosionOfColor, etherBear, lightAndDark, singularity, cyberKongz]

let collections = [
    {"name": "Explosion of Color", artist: "AIIV"},
    {"name": "Ether Bears", artist: "EtherBear"},
    {"name": "Light and Dark", artist: "Phil Bosua"},
    {"name": "Singularity", artist: "AIIV"},
    {"name": "CyberKongz", artist: "CyberKongz"}
]

function createSample(){
    for (let n = 0; n < collectionsLists.length; n++){
        let collection = collectionsLists[n]
        let collectionMetaData = collections[n]
        let month = randInt(1,5), day = randInt(1,28), hour = randInt(0, 23), minutes = randInt(0, 59), seconds = randInt(0,59)
        let releaseDate = new Date(2022, month, day, hour, minutes, seconds)
        let collectionID = makeID(16)
        console.log(n)
        console.log(`collection ${collectionMetaData.name} created`)
        createCollection(collectionMetaData.name, collectionMetaData.artist, releaseDate, collectionID)
        for (let i = 0; i < collection.length; i++) {
            console.log(`item ${collection[i].name} created`)
            //open db
            var db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (error) => {
                if (error) return console.log(error.message);
                console.log("database connected")
            });
            //select random user
            db.all(`SELECT userID, username FROM users`, function (error, users) {
                let lucky = randInt(0,users.length - 1)
                console.log(lucky)
                let userID = users[lucky]["userID"]
                console.log(users[lucky]["username"])
                createItem(collection[i]['name'], userID, `${collectionID}`, collection[i]['link'], "img")
            })
            //close db
            db.close((error) => {
                if (error) return console.log(error.message);
            })
        }
    }
}

// createSample()