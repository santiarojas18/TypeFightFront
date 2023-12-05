function sanitizeInput() {
    var userInput = $('#nombreInput').val();
    var inputToSanitize = DOMPurify.sanitize(userInput);
    var sanitizedInput = inputToSanitize.replace(/[<>]/g, '');
    console.log('Entrada original:', userInput);
    console.log('Entrada sanitizada:', sanitizedInput);
    return sanitizedInput;
}

var register = (function () {

    var stompClient = null;
    var listenersAdded = false;
    var uniqueId;

    function getRandomInt(min = 1, max = 100000) {
        return new Promise(function (resolve, reject) {
            uniqueId = Math.floor(Math.random() * (max - min + 1)) + min;
            resolve(uniqueId);
        });
    }

    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('http://typefightbackendpool.eastus.cloudapp.azure.com/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newplayer.' + uniqueId, function (eventbody) {
                var nameUsed = JSON.parse(eventbody.body);
                console.log(nameUsed);
                if (nameUsed) {
                    var name = sanitizeInput();
                    console.log(nameUsed);
                    var message = "Ya existe un jugador con el nombre de: " + name + ". Inserte otro nombre.";
                    alert(message);
                } else {
                    window.location.href = "lobby.html";
                }
            });
        });
    };


    return {
        init: function () {
            //disconnect connection
            register.disconnect();


            //websocket connection
            getRandomInt().then(function() {
                connectAndSubscribe();
                console.log(uniqueId);
            });


        },

        publishGamer: function(name){
            //publicar el evento
            sessionStorage.setItem("username", name);
            stompClient.send("/app/newplayer." + uniqueId, {}, name);

        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            //setConnected(false);
            console.log("Disconnected");
        }
    };

})();