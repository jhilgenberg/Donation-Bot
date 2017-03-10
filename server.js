    var SteamUser = require('steam-user');
    var SteamTotp = require('steam-totp');
    var steamCommunity = require('steamcommunity');
    var TradeOfferManager = require('steam-tradeoffer-manager');



    var client = new SteamUser();
    client.setOption("promptSteamGuardCode", false);
    var community = new steamCommunity();
    var offers = new TradeOfferManager({
        "steam": client,
        "domain": "-",
        "language": "en",
        "pollInterval": 1000 * 10,
        "cancelTime": 1000 * 60 * 3
    });

    var code = SteamTotp.generateAuthCode("SHARED SECRET");
    client.logOn({
        "accountName": "INSERT USERNAME HERE",
        "password": "INSERT PASSWORD HERE",
        "twoFactorCode": code
    });
    client.on('loggedOn', function(details) {
        console.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
        client.setPersona(SteamUser.Steam.EPersonaState.Offline);
    });

    client.on('steamGuard', function(domain, callback, lastCodeWrong) {
        console.log("Needing steamguard code processing...");
        setTimeout(function() {
            var code = SteamTotp.generateAuthCode(shared_secret);
            callback(code);
        }, 30 * 1000);
    });

    client.on('webSession', function(sessionID, cookies) {
        offers.setCookies(cookies, function(err) {
            if (err) {
                console.log('Unable to set trade offer cookies: ' + err);
                setTimeout(function() {
                    client.webLogOn();
                }, 1000);
            } else {
                console.log("Trade offer cookies set. API Key: " + offers.apiKey);
            }
        });
    });

    fs.readFile('polldata_.json', function(err, data) {
        if (!err) {
           offers.pollData = JSON.parse(data);
        }
    });
    offers.on('pollFailure', function(err) {
        console.log("Error polling for trade offers: " + err);
        setInterval(function() {
            offers.doPoll();
        }, 10000);
    });
    offers.on('pollData', function(pollData) {
        console.log("poll");
        fs.writeFile('polldata_.json', JSON.stringify(pollData));
    });


    offers.on("newOffer", function(offer) {
        if (offer.itemsToGive.length == 0) {
            offer.getUserDetails(function(err,me,their) {
                if ((!err) && (me.escrowDays == 0) && (their.escrowDays == 0)) {
                    offer.accept(function(er,status) {
                        if (!err) {
                            console.log("Offer accepted | status ",status);
                        }
                    });
                }
            });
        }


    });
