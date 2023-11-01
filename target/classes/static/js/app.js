var app = (function () {

    var stompClient = null;
    var currentWords = [];
    var paintedWords = [];
    var listenersAdded = false;
    var username;
    var life = 100;
    const userWord = document.getElementById("userWord");

    var setParameters = function(){
        username = sessionStorage.getItem("username");
        if (username) {
            // El nombre del usuario se encuentra en SessionStorage
            console.log("Nombre de usuario: " + username);
        } else {
            // El nombre del usuario no se encuentra en SessionStorage
            console.log("Usuario no registrado");
        }
    };

    function updateLifeBar() {
        var lifeFill = document.getElementById("lifeFill");
        var lifeText = document.getElementById("lifeText");
        var lifePercentage = (life / 100) * 100; // Ajusta el 100 según el rango de vida máximo
    
        // Actualiza el ancho de la barra de vida
        lifeFill.style.width = lifePercentage + "%";
    
        // Actualiza el número de vida
        lifeText.textContent = life;
    }

    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var getMousePositionWithPage = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.pageX - rect.left,
            y: evt.pageY - rect.top
        };
    };

    const listenerForWritting = function (event) {
        if (event.key.length === 1) {
            // Solo se procesa la entrada si es una letra (no se procesan teclas especiales, números, etc.).
            const currentWord = userWord.textContent;
            const newWord = currentWord + event.key;
            userWord.textContent = newWord;
        } else if (event.key === "Backspace") {
            // Manejar la tecla de retroceso (Backspace) para borrar la última letra.
            const currentWord = userWord.textContent;
            const newWord = currentWord.slice(0, -1); // Elimina el último carácter.
            userWord.textContent = newWord;
        } else if (event.key === "Enter") {
            // publicar palabra cuando se presiona Enter.
            app.publishWrittenWord(userWord.textContent);
        }
    };

    var displayCurrentWords = function () {
        var wordGridContainer = document.getElementById("wordGridContainer");
        currentWords.forEach(function (word) {
            // Verifica si la palabra no ha sido pintada previamente en la pantalla
            if (!paintedWords.some(function (position) {
                return position.word === word;
            })) {
                var wordElement = document.createElement("div");
                wordElement.textContent = word;
                wordElement.classList.add("word");
                wordElement.id = word;
                // Variables para controlar la posición
                var row, column;
                var positionOccupied = true;
                // Encuentra una posición no ocupada y que no se superponga
                while (positionOccupied) {
                    row = Math.floor(Math.random() * 4) + 1; // Número de fila aleatorio
                    column = Math.floor(Math.random() * 4) + 1; // Número de columna aleatorio
                    // Verifica si la posición está ocupada por otra palabra
                    positionOccupied = paintedWords.some(function (position) {
                        return position.row === row && position.column === column;
                    });
                }
                // Establece la posición de la palabra en la cuadrícula utilizando CSS Grid
                wordElement.style.gridRow = row;
                wordElement.style.gridColumn = column;
                wordGridContainer.appendChild(wordElement);
                // Agrega la palabra a la lista de palabras pintadas
                paintedWords.push({ row: row, column: column, word: word });
            }
        });
    };
    


    var connectAndSubscribe = function () {
        return new Promise(function (resolve, reject) {
            console.info('Connecting to WS...');
            var socket = new SockJS('typefightback.azurewebsites.net/stompendpoint');
            stompClient = Stomp.over(socket);

            stompClient.connect({}, function (frame) {
                console.log('Connected: ' + frame);
                stompClient.subscribe('/topic/catchword', function (eventbody) {
                    var receivedWord = eventbody.body;
                    console.log("Palabra a borrar" +receivedWord);
                    var wordToRemoveIndex = paintedWords.findIndex(function (position) {
                        return position.word === receivedWord;
                    });
                    console.log(wordToRemoveIndex);
                    console.log(paintedWords);
                    if (wordToRemoveIndex !== -1) {
                        var wordElement = document.getElementById(receivedWord);
                        if (wordElement) {
                            wordElement.parentNode.removeChild(wordElement);
                        }
                        paintedWords.splice(wordToRemoveIndex, 1);
                    }
                    userWord.textContent = "";
                });

                stompClient.subscribe('/topic/showCurrentWord', function (eventbody) {
                    var currentWordsList = JSON.parse(eventbody.body); // Convierte la lista de palabras de formato JSON
                    currentWords = currentWordsList; // Actualiza la lista de palabras actuales
                    displayCurrentWords();
                });

                stompClient.subscribe('/topic/updateHealth.' + username, function (eventbody) {
                    life = eventbody.body
                    if (life <= 0) {
                        document.removeEventListener("keydown", listenerForWritting);
                    }
                    updateLifeBar();
                });

                stompClient.subscribe('/topic/thereIsAWinner', function (eventbody) {
                    var theWinner = JSON.parse(eventbody.body);
                    var playerName = theWinner.name;
                    var message = "El ganador es: " + playerName ;
                    alert(message);

                    // Redirige a otra página después de que el usuario haga clic en "Aceptar" en el alert
                    window.location.href = 'ranking.html';
                });

                stompClient.subscribe('/topic/newentrygame', function (eventbody) {
                    var theObject=JSON.parse(eventbody.body);
                    console.log(theObject);
                    setPlayersNumber(theObject.length, theObject);
                });

                resolve();
            });
        });
    };
    
    
    return {
        addListeners: function () {
            document.addEventListener("keydown", listenerForWritting);
        },

        init: function (newSession) {
            if (!listenersAdded) {
                app.addListeners();
                listenersAdded = true;
            }

            setParameters();
            updateLifeBar();

            //disconnect connection
            app.disconnect();

            //websocket connection
            connectAndSubscribe().then(function() {
                app.publishEntry();
            });
        },

        publishWrittenWord: function(writtenWord){
            console.info("The word written is "+ writtenWord);
            //addPointToCanvas(pt);

            var message = {
                username: username,
                writtenWord: writtenWord
            };

            //publicar el evento
            stompClient.send("/app/catchword", {}, JSON.stringify(message));
        },

        publishEntry: function(){
            //publicar el evento
            stompClient.send("/app/newentrygame", {});
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

