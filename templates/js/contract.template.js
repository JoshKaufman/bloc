var Contract = require('Contract');
var blockApps = blockApps || {};
var modules = blocks.modules || {};

modules['{{contractName}}'] = (function(
    apiURL,
    contractName,
    appAddress,
    xAbiString){
    var globalKeystore;
    var faucetEndpoint = apiURL + '/etc/' + apiVersion + '/faucet';
    var userObj = getUserObj();
    var _user = null;
    var walletCreated = false;
    var authWidget = null; //login or create (determines which UI widget to show)

    var terminal = {
        _banner: 'TX returned: ',
        TXLine: function (result) {
            this._ticker_banner = this._banner + (
                (result === undefined)
                ? '(nothing)'
                : result ) +
                '\n\n' +
                'Contract storage state: \n\n';
        },
        createTickerBuffer: function ( storageKeys ) {
            this.tickers = [this._ticker_banner];
            return (function () {
                for ( var svar in storageKeys ) {
                    this._tickers.push( [svar, storageKeys[svar]].join(' = ') );
                }
            }).bind( this );
        },
        flush: function () {
            getContainer('consoleWidget').textContent = this._ticker.join('\n ');
        }
    };

    var message = {
        show: function (msg) {
            this.set(msg);
            updateUI();
        },
        set: function (msg) {
            this.__msg = msg;
        },
        has: function () {
            !!this.__msg;
        },
        clear: function () { this.__msg = null;}
    };

    function register() {
        submitUser(userObj, function (res) {
            walletCreated = true;
            var data = JSON.parse(res);
            var faucetReq = null;
            message.set('Confirm in your email. ' +
                'This is your new wallet file: \n\n' + res);
            var faucetAddr = JSON.parse(data.encrypedWallet).addresses;
            console.log('wallet: ' + data.encryptedWallet);
            console.log('addresses: ' + faucetAddr);
            faucetReq = blocPostXHR(faucetEndpoint, {
                address: faucetAddr
            });

            faucetReq.onload = function(){
                if ( faucetReq.readyState == 4 && faucetReq.status == 200) {
                    console.log('faucet should have worked');
                } else {
                    console.log('error');
                }
            };
            updateUI();
        });
    }

    function login () {
        retrieveUser(userObj, function (keystore) {
            message.set('Retrieved your wallet. Enter your password, ' +
                'and you can sign transactions: ');
            wallet = keystore.addresses[0];
            globalKeystore = keystore;
            toAccount = Contract({
                address: appAddress,
                symtab: xAbiString
            });
        });
    }

    function genKeyUser (keyPass) {
        console.log('moving from keygen to create user');
        genKey(keyPass, function (keystore) {
            walletAddress = keystore.addresses[0]
            encKey = keystore.serialize();
            updateUI();
        });
    }

    return {
        {{#funcs}}
        call{{name}}: call{{name}},
        {{/funcs}}
        showLogin: function(){authWidget = 'login'; updateUI();},
        showRegister: function(){authWidget = 'register'; updateUI();},
        signup: register,
        login: login,
        genKeyUser: genKeyUser,
        render: updateUI
    };

    function blocPostXHR(endpoint, paramObj) {
        var oReq = new XMLHttpRequest();
        var paramStr = Object.keys(paramObj).map(function(key, index){
            return key + '=' + encodeURIComponent(paramObj[key] || '');
        }).join('&');
        oReq.open("POST", endpoint, true);
        oReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        /*
         * temp hack to make sure the load handler will be hooked up before we
         * kick of the request
         * will refector on next iteration
        */
        setTimeout(function(){
            console.log('sending faucet request');
            oReq.send(paramStr);
            console.log('faucet request sent');
        });
        return oReq;
    };

    function updateUI () {
        var registerWidget = toggleWidget(
                (!walletCreated && authWidget === 'register'),
                getContainer('createUser')
            ),
            loginWindget = toggleWidget(!walletCreated && authWidget === 'login',
                getContainer('login')),
            walletUnlocker = toggleWidget(walletCreated || _user,
                getContainer('walletUnlockerWidget')),
            walletWidget = toggleWidget(_user && _user !== null,
                getContainer('wallet')),
            contractControllsWidget = toggleWidget(_user && _user !== null,
                getContainer('functions')),
            consoleWidget = toggleWidget(_user && _user !== null,
                getContainer('console')),
            keygenWidget = toggleWidget(!walletCreated && authWidget === 'register',
                getContainer('keygen')),
            messageWidget = toggleWidget(hasMessage(),
                getContainer('messages'));

        function toggleWidget (conditional, widget) {
            widget.style.display = conditional ? 'table' : 'none';
            return widget;
        }
        function getContainer (name) {
            return document.getElementById(name+contractName+'Div');
        }
    }

    {{#funcs}}
    function call{{name}} () {
        var args = {{{args}}};
        var fArgs = {};
        console.log('globalKeystore: ' + JSON.stringify(globalKeystore);
        console.log('privKey: ' +
            globalKeystore.exportPrivateKey(
                walletaddress.value,
                walletDecrypt.value
            )
        );
        var fromAccount = Contract({
            privKey: globalKeystore.exportPrivateKey(
                walletaddress.value,
                walletDecrypt.value
            )
        });

        console.log('fromAccount: ' + JSON.stringify(fromAccount));
        args.forEach(function(arg) {
            fArgs[arg] = document.getElementById('{{name}}' + arg).value;
        });
        var terminalBuffer = terminal.createTickerBuffer();
        toAccount.call('{{{confURL}}}', function(result) {
            terminal.TXLine(result);
            toAccount.sync("{{{confURL}}}", function(){
                terminalBuffer();
                terminal.flush();
            });
        }, fArgs);
    }
    {{/funcs}}
})('{{{confURL}}}', '{{contractName}}', '{{address}}', {{{xAbiString}}});

