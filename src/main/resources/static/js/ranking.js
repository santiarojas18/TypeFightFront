var ranking = (function () {

    var stompClient = null;

    var connectAndSubscribe = function () {
        return new Promise(function (resolve, reject) {
            console.info('Connecting to WS...');
            var socket = new SockJS('/stompendpoint');
            stompClient = Stomp.over(socket);

            stompClient.connect({}, function (frame) {
                console.log('Connected: ' + frame);
                stompClient.subscribe('/topic/showWinner', function (eventbody) {
                    var theObject=JSON.parse(eventbody.body);

                    $("#winner-title").text("El ganador es: " + theObject[0].name);
                    var tbody = document.getElementById("ranking-table").getElementsByTagName("tbody")[0];
                    while (tbody.firstChild) {
                        tbody.removeChild(tbody.firstChild);
                    }

                    var counter = 0;
                    var rowsToAdd= theObject.map(function(player) {
                        console.log(player);
                        var fila = tbody.insertRow(counter);
                        var positionCell = fila.insertCell(0);
                        positionCell.innerHTML = counter + 1;
                        var nameCell = fila.insertCell(1);
                        nameCell.innerHTML = player.name;
                        var colorCell = fila.insertCell(2);
                        colorCell.innerHTML = player.color;
                        var pointsCell = fila.insertCell(3);
                        pointsCell.innerHTML = player.points;
                        counter = counter + 1;
                        return fila;
                    });

                });

                stompClient.subscribe('/topic/playAgain', function (eventbody) {

                });
                resolve(); // Resuelve la promesa cuando la conexión está lista
            });
        });

    };


    return {
        init: function () {
            //disconnect connection
            ranking.disconnect();

            //websocket connection
            connectAndSubscribe().then(function() {
                ranking.publishWinner();
            });

        },

        publishWinner: function(){
            console.info("Publishing winner ");
            //publicar el evento
            stompClient.send("/app/showWinner", {});
        },

        publishPlayAgain: function(){
            const username = sessionStorage.getItem("username");
            //publicar el evento
            stompClient.send("/app/playAgain", {}, username);
            window.location.href = "lobby.html";

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