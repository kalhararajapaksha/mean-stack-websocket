const http = require("http");
const app = require("express")();
const MongoClient = require('mongodb').MongoClient;

app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"))

 app.listen(9091, ()=>console.log("Listening on http port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"))
//hashmap clients
const clients = {};
const games = {};
var shedules = {};

//database connection
const uri = "mongodb+srv://cluster1mean:vrU1YqaDsTccrgAJ@cluster0.lvh58gt.mongodb.net?retryWrites=true&w=majority";

const db_con = new MongoClient(uri, { useNewUrlParser: true });
db_con.connect(err => {
    const collection= db_con.db("meanStackExample").collection("shedule");
    // perform actions on the collection object
    collection.find().toArray(function(err, result) {
        if (err) throw err;
        shedules=result;
        console.log(shedules);
        db_con.close();
      });
  })


const wsServer = new websocketServer({
    "httpServer": httpServer
})
wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        console.log(`Received message => ${message}`);
        const result = JSON.parse(message.utf8Data)
        //a client want to join
        if (result.method === "join") {
            const gameId2 = result.gameId;
            const isAvailable = games[gameId2]?.id;
            if(!games[gameId2]?.id){
                games[gameId2] = {
                    "id": gameId2,
                    "balls": 22,
                    "clients": []
                }
            }

            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];


            game.clients.push({
                "clientId": clientId,
                "color": "Red"
            })


            const payLoad = {
                "method": "join",
                "game": game
            }
            //loop through all clients and tell them that people has joined
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }
        //a user plays
        if (result.method === "play") {
            const gameId = result.gameId;
            const ballId = result.ballId;
            const color = result.color;
            let state = games[gameId].state;
            if (!state)
                state = {}           
            state[ballId] = color;
            games[gameId].state = state;
            updateGameState();
        }


    })

    //generate a new clientId
    const clientId = guid();

    clients[clientId] = {
        "connection":  connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))

})


function updateGameState(){

    //{"gameid", fasdfsf}
    for (const g of Object.keys(games)) {
        const game = games[g]
        const payLoad = {
            "method": "update",
            "game": game
        }

        game.clients.forEach(c=> {
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
        })
    }

    //setTimeout(updateGameState, 500);
}



function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 

