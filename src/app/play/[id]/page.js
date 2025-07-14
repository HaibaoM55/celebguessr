"use client";

import Image from "next/image";
import styles from "../../page.module.css";
import { useState, useEffect, use } from "react";
import db from "../../firebaseconfig.js";
import {useInterval} from "../../useinterval"
import {
    collection,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
} from "firebase/firestore";
import { useParams } from "next/navigation";

const maxPlayers = 10;
//test
const addPlayer = async (gameId, playerId, profile, numid = 0) => {
    try {
        await setDoc(doc(db, "games", gameId, "players", playerId), {
            knowsceleb: false,
            guessed: false,
            score: 0,
            pfp: profile,
            isInCurrentGame: false,
            isHost: false,
            numid: numid,
            word: "",
            kicked: false,
        });
        console.log("Player added!");
    } catch (e) {
        console.error("Error adding player: ", e);
    }
};

const getGame = (gameId, onUpdate = () => { }, onError = () => { }) => {
    const docRef = doc(db, "games", gameId);

    const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                onUpdate({
                    id: docSnap.id,
                    isPublic: data.public,
                    word: data.word,
                    roundStartTime: data.roundStartTime,
                    isGamePlayed: data.isGamePlayed,
                    knownword: data.knownword,
                });
            } else {
                onError("Game not found.");
            }
        },
        (error) => {
            console.error("onSnapshot error:", error);
            onError(error.message || "Unknown error.");
        }
    );

    return unsubscribe;
};
export default function Home() {
    const { id: gameId } = useParams();
    const [userPfpNumber, setUserPfpNumber] = useState(1);
    const [UserPfp, setUserPfp] = useState("/profiles/guy1.png");

    const [game, setGame] = useState({});
    const [players, setPlayers] = useState([]);
    const [nameInput, setNameInput] = useState("");
    const [pressedPlay, setPressedPlay] = useState(false);
    const [isGamePlayed, setIsGamePlayed] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [writeCeleb, setWriteCeleb] = useState(false);
    const [canWrite, setCanWrite] = useState(true);
    const [correctWord, setCorrectWord] = useState("");
    const [centerText, setCenterText] = useState("");
    const [knowsCeleb, setKnowsCeleb] = useState(false);
    const [yourScore, setYourScore] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [guessedRight, setGuessedRight] = useState(false);
    const [knownWord, setKnownWord] = useState("");
    const [isHost, setIsHost] = useState(false)
    const [everyoneGuessedRight, setEveryoneGuessedRight] = useState(false);
    useEffect(() => {
        if (userPfpNumber < 1) {
            setUserPfpNumber(6);
        } else if (userPfpNumber > 6) {
            setUserPfpNumber(1);
        } else {
            setUserPfp(`/profiles/guy${userPfpNumber}.png`);
        }
    }, [userPfpNumber]);

    useEffect(() => {
        if (!gameId) return;

        const unsubscribe = getGame(
            gameId,
            (data) => setGame(data),
            (errMsg) => console.error(errMsg)
        );

        return () => unsubscribe();
    }, [gameId]);

    useEffect(() => {
        if (!gameId) return;

        const playersRef = collection(db, "games", gameId, "players");
        const unsubscribe = onSnapshot(playersRef, (snapshot) => {
            const playersList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPlayers(playersList);
        });

        return () => unsubscribe();
    }, [gameId]);
    function finishGame(){
        const documentRef = doc(db, "games", gameId);
        setDoc(documentRef, {word: "", knownword: "", isGamePlayed: false}, {merge: true});
        for(var i = 0; i < players.length; i++){
            const playerRef = doc(db, "games", gameId, "players", players[i].id)
            setDoc(playerRef, {guessed: false, word: ""}, {merge: true});
        }
    }
    useEffect(() => {
        var everyoneGuessd = true;
        for(var i = 0; i < players.length; i++) {
            if (players[i].id == nameInput){
                setIsHost(players[i].isHost);
            }
            if(!players[i].guessed && !players[i].knowsceleb){
                everyoneGuessd = false;
            }
        }
        setEveryoneGuessedRight(everyoneGuessd);
        if(isGamePlayed){
            if(everyoneGuessd && isHost){
                finishGame();
            }
        }else{
            setGuessedRight(false);
        }
    }, [players, game]);
    useEffect(() => {
        setIsGamePlayed(game.isGamePlayed);
        setCorrectWord(game.word);
        setStartTime(game.roundStartTime);
        setKnownWord(game.knownword);
        for(var i = 0; i < players.length; i++){
            if(players[i].id == nameInput){
                if(game.word == "" && players[i].knowsceleb){
                    setWriteCeleb(true);
                }else{
                    setWriteCeleb(false);
                }
            }
        }
        if(!isGamePlayed){
            setCenterText("Waiting for the game to start")
        }else if(!knowsCeleb && !guessedRight && isGamePlayed){
            setCenterText(game.knownword)
        }else if(isGamePlayed){
            if(guessedRight){
                setCenterText(game.word);
            }else if(knowsCeleb){
                if(game.word == ""){
                    setCenterText("Write the celebrity's name")
                }else{
                    setCenterText(game.word);
                }
            }
        }
    }, [game, isGamePlayed, knowsCeleb, guessedRight, players, game])
    useInterval(() => {
        let milliseconds = new Date().valueOf();
        let seconds = Math.floor( milliseconds / 1000);
        setTimeLeft(150+startTime-seconds);
    }, 1000)
    function play() {
        if (players.length < maxPlayers) {
            const exists = players.some((p) => p.id === nameInput);
            if (exists) {
                alert("Somebody else already has that name!");
            }else if(nameInput == ""){
                alert("Please set a name!")
            }else if(nameInput.length > 16){
                alert("Username cannot exceed 16 characters")
            }else{
                const maxNumId = Math.max(
                    ...players.map((p) => p.numid),
                    -1
                );
                addPlayer(gameId, nameInput, userPfpNumber, maxNumId + 1);
                setPressedPlay(true);
                document.getElementById("inputDiv").style.display = "none";
                document.getElementById("gameInfo").style.display = "block";
            }
        }else{
            alert("The maximum player capacity has been reached!")
        }
    }
    function start(){
        if(players.length >= 2){
            const documentRef = doc(db, "games", gameId);
            setTimeLeft(30);
            setDoc(documentRef, {knownword: "Waiting for celebrity name"},{merge: true})
            setCorrectWord("")
            setDoc(documentRef, {word: ""}, { merge: true });
            var lastToKnowCeleb = -1;
            var biggestNumId = 0;
            var smallestNumId = players[0].numid;
            for(var i = 0; i < players.length; i++) {
                const playerRef = doc(db, "games", gameId, "players", players[i].id);
                if(players[i].knowsceleb){
                    lastToKnowCeleb = players[i].numid;
                    setDoc(playerRef, { knowsceleb: false }, { merge: true })
                }
                if(biggestNumId < players[i].numid){
                    biggestNumId = players[i].numid
                }
                if(smallestNumId > players[i].numid){
                    smallestNumId = players[i].numid;
                }
            }
            if(lastToKnowCeleb == -1){
                lastToKnowCeleb = smallestNumId-1;   
            }
            if(lastToKnowCeleb >= biggestNumId){
                lastToKnowCeleb = smallestNumId-1;
            }
            setDoc(documentRef, {isGamePlayed: true}, {merge: true});
            for(var i = 0; i < players.length; i++){
                if(players[i].numid == lastToKnowCeleb+1){
                    const playerRef = doc(db, "games", gameId, "players", players[i].id);
                    players[i].knowsceleb = true;
                    setDoc(playerRef, { knowsceleb: true }, { merge: true })
                }
            }
            for(var i = 0; i < players.length; i++) {
                const playerRef = doc(db, "games", gameId, "players", players[i].id);
                setDoc(playerRef, {isInCurrentGame: true}, {merge: true})
                if (players[i].id == nameInput){
                    if(players[i].knowsceleb){
                        if(correctWord == ""){
                            setCenterText("Write the celebrity's name")
                        }
                    }
                }
            }
        }else{
            alert("At least 2 players are needed in order to play!")
        }
    }
    // Remove player ONLY when tab is closed or refreshed
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            // Remove player from Firestore
            const playerRef = doc(db, "games", gameId, "players", nameInput);
            deleteDoc(playerRef)
                .then(() => {
                    console.log("Player removed successfully!");
                })
                .catch((error) => {
                    console.error("Error removing player:", error);
                });
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [gameId, nameInput]);
    useEffect(() => {
        if (players.length === 0 || !gameId) return; 
        var minimumNumId = -1, minimumNumIdI;
        for(var i = 0; i < players.length; i++) {
            if (players[i].numid < minimumNumId || minimumNumId == -1){
                minimumNumId = players[i].numid;
                minimumNumIdI = i;
            }
        }
        for(var i = 0; i < players.length; i++){
            if(players[i].id == nameInput){
                if(players[i].kicked){
                    location.href = "/?kicked=true"
                }
                setKnowsCeleb(players[i].knowsceleb)
            }
        }
        const hostId = players[minimumNumIdI].id;
        const hostRef = doc(db, "games", gameId, "players", hostId);
        setDoc(hostRef, { isHost: true }, { merge: true })
            .then(() => {
                console.log("Host updated successfully!");
            })
            .catch((error) => {
                console.error("Error updating host:", error);
            }
        );
        players.forEach((player) => {
            if (player.id !== hostId) {
                const playerRef = doc(db, "games", gameId, "players", player.id);
                setDoc(playerRef, { isHost: false }, { merge: true })
                    .then(() => {
                        console.log(`Player ${player.id} updated to not host.`);
                    })
                    .catch((error) => {
                        console.error(`Error updating player ${player.id}:`, error);
                    });
            }
        }
        );
    }, [players, gameId]);
    useEffect(() => {
        if(pressedPlay == true){
            document.getElementById("textInputDiv").style.display = "block";
        }else{
            document.getElementById("textInputDiv").style.display = "none";
        }
    }, [pressedPlay])
    useEffect(() => {
        if(timeLeft <= 0){
            if(isHost && isGamePlayed && correctWord != ""){
                finishGame();
            }
        }
    }, [timeLeft])
    return (
        <div>
            {/* <h1>
                DEBUG:<br />
                isHost: {isHost ? isHost.toString() : "undefined"}<br />
                isGamePlayed: {isGamePlayed ? isGamePlayed.toString() : "undefined"}<br />
                everyoneGuessedRight: {everyoneGuessedRight ? everyoneGuessedRight.toString() : "undefined"}<br />
            </h1> */}
            <div className={styles.icon}>
                <Image src="/icon.png" height={100} width={500} alt="icon" />
            </div>
            {game ? (
                <div id = "gameInfo" className={styles.gameInfo}>
                    {(isGamePlayed && (centerText != "Waiting for celebrity name" && centerText != "Write the celebrity's name" && !writeCeleb)) ? (                        
                        <div className={styles.time}>
                            <Image src = {"/clock.png"} alt = {"clock"} height={50} width={50} className={styles.clockImg} />
                            {timeLeft}
                        </div>
                    ) : (<></>)}
                    <div>
                        <ul>
                        <div className={styles.centerText}>
                            {centerText}
                        </div>
                            {players.map((player) => (
                                <li key={player.id} className={styles.playerInfo}>
                                    {(isHost && player.id != nameInput)? (
                                        <button className={styles.kickBtn}
                                        onClick={()=>{
                                            const playerRef = doc(db, "games", gameId, "players", player.id);
                                            setDoc(playerRef, {kicked: true}, {merge: true})
                                            setTimeout(() => {
                                                const playerRef1 = doc(db, "games", gameId, "players", player.id);
                                                deleteDoc(playerRef1)
                                                    .then(() => {
                                                        console.log("Player removed successfully!");
                                                    })
                                                    .catch((error) => {
                                                        console.error("Error removing player:", error);
                                                    });
                                            }, 750)
                                        }}
                                        >
                                            Kick
                                        </button>): (<></>)
                                    }
                                    <Image
                                        src={`/profiles/guy${player.pfp}.png`}
                                        height={50}
                                        width={50}
                                        alt={`Profile picture of ${player.id}`}
                                        className={styles.pfpIcon}
                                    />
                                    <div className={styles.playerInfoParagraph}>
                                        {player.id}
                                        {player.id == nameInput ? " (You)": ""}
                                        {player.isHost ? " (Host)" : ""}
                                        {player.knowsceleb
                                            ? <Image className={styles.knowsceleb} alt = {`knoesceleb.png`} width={50} height={50} src = {`/knowsceleb.png`}></Image>
                                            : ""}
                                        : 
                                        {` ${player.score}`}
                                    </div>
                                    {(isGamePlayed && !player.knowsceleb) ? (
                                        <>
                                            {(player.guessed) ? (
                                                <Image 
                                                src = "/check.png" 
                                                alt = "check"
                                                height={50} 
                                                width={50}
                                                ></Image>
                                            ): (
                                                <Image 
                                                src = "/cross.png" 
                                                alt = "cross"
                                                height={50} 
                                                width={50}
                                                ></Image>
                                            )}
                                        </>
                                    ) : (<></>)}
                                    
                                    {(player.word != "") ? (
                                        <div className={styles.DialogueBox} id = "dialogue_box">
                                            {player.word}
                                        </div>
                                    ) : (<></>)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <p>Loading...</p>
            )}
            <div className={styles.textInputDiv} id = "textInputDiv">
                <input
                type = "text"
                placeholder=""
                id = "textInputBox"
                onKeyUp={(event) => {
                    if (event.key === "Enter"){
                        const documentRef = doc(db, "games", gameId);
                        if(writeCeleb){
                            let milliseconds = new Date().valueOf();
                            let seconds = Math.floor( milliseconds / 1000);
                            setDoc(documentRef, { roundStartTime:  seconds}, {merge: true})
                            const theword = document.getElementById("textInputBox").value.toUpperCase();
                            setDoc(documentRef, { word: theword }, {merge: true})
                            setCenterText(theword);
                            var theknownword=""
                            for(var i = 0; i < theword.length; i++){
                                theknownword=theknownword+'_ '
                            }
                            setDoc(documentRef, { knownword: theknownword }, {merge: true})
                            setWriteCeleb(false);        
                            document.getElementById("textInputBox").value = "";
                        }else if(canWrite){
                            const playerRef = doc(db, "games", gameId, "players", nameInput);
                            if(!guessedRight && isGamePlayed && document.getElementById("textInputBox").value.toUpperCase() == correctWord){
                                setDoc(playerRef, {guessed: true}, {merge: true})
                                var yourScoreProv =yourScore+timeLeft*2+50;
                                setYourScore(yourScoreProv);
                                setDoc(playerRef, {score: yourScoreProv}, {merge: true})
                                for(var i = 0; i < players.length; i++){
                                    if(players[i].knowsceleb){
                                        const playerKnowsCelebRef = doc(db, "games", gameId, "players", players[i].id);
                                        var playerKnowsCelebProvScore = players[i].score+timeLeft+50;
                                        setDoc(playerKnowsCelebRef, {score: playerKnowsCelebProvScore}, {merge: true})
                                    }
                                }
                                setGuessedRight(true);
                                let modifiedWord = "";
                                let lengthOfTheKnownWord =knownWord.length; 
                                let didIModify=false;
                                var underscoreNumber = 0;
                                for(var i = 0; i < lengthOfTheKnownWord; i++){
                                    if(knownWord[i] == '_'){
                                        underscoreNumber++;
                                    }
                                }
                                setCenterText(correctWord)
                                if(underscoreNumber >= 2){
                                    for (let i = 0; i < lengthOfTheKnownWord; i++) {
                                        if (i % 2 === 0 && knownWord[i] === '_' && !didIModify){
                                            modifiedWord += correctWord[Math.floor(i / 2)];
                                            didIModify = true;
                                        } else {
                                            modifiedWord += knownWord[i];
                                        }
                                    }
                                    setDoc(documentRef, {knownword: modifiedWord}, {merge:true});
                                }
                            }else if(document.getElementById("textInputBox").value.toUpperCase() == correctWord){
                                alert("You cant spell it out for everyone >:(")
                            }else{
                                setDoc(playerRef, { word: document.getElementById("textInputBox").value }, { merge: true })
                                setCanWrite(false);
                                setTimeout(() => {
                                    const playerRef = doc(db, "games", gameId, "players", nameInput);
                                    setDoc(playerRef, { word: "" }, { merge: true })
                                    setCanWrite(true);
                                }, 1000+document.getElementById("textInputBox").value.length*50)
                            }
                            document.getElementById("textInputBox").value = "";
                        }
                    }
                }}
                className={styles.textInputBox}
                ></input>
                <button onClick = {() =>{
                        const documentRef = doc(db, "games", gameId);
                        if(writeCeleb){
                            let milliseconds = new Date().valueOf();
                            let seconds = Math.floor( milliseconds / 1000);
                            setDoc(documentRef, { roundStartTime:  seconds}, {merge: true})
                            const theword = document.getElementById("textInputBox").value.toUpperCase();
                            setDoc(documentRef, { word: theword }, {merge: true})
                            setCenterText(theword);
                            var theknownword=""
                            for(var i = 0; i < theword.length; i++){
                                theknownword=theknownword+'_ '
                            }
                            setDoc(documentRef, { knownword: theknownword }, {merge: true})
                            setWriteCeleb(false);        
                            document.getElementById("textInputBox").value = "";
                        }else if(canWrite){
                            const playerRef = doc(db, "games", gameId, "players", nameInput);
                            if(!guessedRight && isGamePlayed && document.getElementById("textInputBox").value.toUpperCase() == correctWord){
                                setDoc(playerRef, {guessed: true}, {merge: true})
                                var yourScoreProv =yourScore+timeLeft*2+50;
                                setYourScore(yourScoreProv);
                                setDoc(playerRef, {score: yourScoreProv}, {merge: true})
                                for(var i = 0; i < players.length; i++){
                                    if(players[i].knowsceleb){
                                        const playerKnowsCelebRef = doc(db, "games", gameId, "players", players[i].id);
                                        var playerKnowsCelebProvScore = players[i].score+timeLeft+50;
                                        setDoc(playerKnowsCelebRef, {score: playerKnowsCelebProvScore}, {merge: true})
                                    }
                                }
                                setGuessedRight(true);
                                let modifiedWord = "";
                                let lengthOfTheKnownWord =knownWord.length; 
                                let didIModify=false;
                                var underscoreNumber = 0;
                                for(var i = 0; i < lengthOfTheKnownWord; i++){
                                    if(knownWord[i] == '_'){
                                        underscoreNumber++;
                                    }
                                }
                                setCenterText(correctWord)
                                if(underscoreNumber >= 2){
                                    for (let i = 0; i < lengthOfTheKnownWord; i++) {
                                        if (i % 2 === 0 && knownWord[i] === '_' && !didIModify){
                                            modifiedWord += correctWord[Math.floor(i / 2)];
                                            didIModify = true;
                                        } else {
                                            modifiedWord += knownWord[i];
                                        }
                                    }
                                    setDoc(documentRef, {knownword: modifiedWord}, {merge:true});
                                }
                            }else if(document.getElementById("textInputBox").value.toUpperCase() == correctWord){
                                alert("You cant spell it out for everyone >:(")
                            }else{
                                setDoc(playerRef, { word: document.getElementById("textInputBox").value }, { merge: true })
                                setCanWrite(false);
                                setTimeout(() => {
                                    const playerRef = doc(db, "games", gameId, "players", nameInput);
                                    setDoc(playerRef, { word: "" }, { merge: true })
                                    setCanWrite(true);
                                }, 1000+document.getElementById("textInputBox").value.length*50)
                            }
                            document.getElementById("textInputBox").value = "";
                        }
                    }
                } className={styles.enterBtn}>
                    <Image src = {`/sendmsg.png`}
                    alt = "Send"
                    height={50}
                    width={50}
                    />
                </button>
            </div>
            {pressedPlay ? (<></>):
            (<div className={styles.inputDiv} id = "inputDiv">
                <div className={styles.inputParent}>
                    <input
                        className={styles.input}
                        placeholder="Enter your name"
                        onChange={(event) => setNameInput(event.target.value)}
                    />
                </div>

                <div className={styles.pfp}>
                    <Image
                        className={styles.arrow}
                        src="/leftarrow.svg"
                        height={50}
                        width={50}
                        alt="left_arrow"
                        onClick={() => setUserPfpNumber(userPfpNumber - 1)}
                    />
                    <Image
                        src={UserPfp}
                        height={128}
                        width={128}
                        alt="profile_picture"
                    />
                    <Image
                        className={styles.arrow}
                        src="/rightarrow.svg"
                        height={50}
                        width={50}
                        alt="right_arrow"
                        onClick={() => setUserPfpNumber(userPfpNumber + 1)}
                    />
                </div>
                <div className={styles.playBtnDiv}>
                    <button className={styles.playBtn} onClick={play}>
                        Play
                    </button>
                </div>
            </div>)}
            {isHost ? (
                <>
                {isGamePlayed ? (<></>) : 
                    (<div className = {styles.hostInfo}>
                        <div className = {styles.playBtnDiv}>
                            <button className = {styles.playBtn} onClick = {start}>
                                Start
                            </button>
                        </div>
                    </div>)}
                </>
            ) : (<></>)}
        </div>
    );
}
