"use client";

import Image from "next/image";
import styles from "../../page.module.css";
import { useState, useEffect } from "react";
import { db } from "../../firebaseconfig.js";
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
    const [correctWord, setCorrectWord] = useState("");
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
    useEffect(() => {
        setCorrectWord(game.word);
    }, [game])
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
            setCorrectWord("")
            const documentRef = doc(db, "games", gameId);
            setDoc(documentRef, {word: ""})
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
            for(var i = 0; i < players.length; i++){
                if(players[i].numid == lastToKnowCeleb+1){
                    const playerRef = doc(db, "games", gameId, "players", players[i].id);
                    players[i].knowsceleb = true;
                    setDoc(playerRef, { knowsceleb: true }, { merge: true })
                    setDoc(playerRef, { isInCurrentGame: true}, {merge: true})
                }
            }
            for(var i = 0; i < players.length; i++) {
                const playerRef = doc(db, "games", gameId, "players", players[i].id);
                setDoc(playerRef, {isInCurrentGame: true}, {merge: true})
                if (players[i].id == nameInput){
                    alert(players[i].knowsceleb)
                    alert(correctWord)
                    if(players[i].knowsceleb && correctWord == ""){
                        setWriteCeleb(true);
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
    const [isHost, setIsHost] = useState(false)
    useEffect(() => {
        setIsGamePlayed(false);
        for(var i = 0; i < players.length; i++) {
            if (players[i].id == nameInput){
                setIsHost(players[i].isHost);
            }
            if(players[i].isInCurrentGame){
                setIsGamePlayed(true);
            }
        }
        if(isGamePlayed){
            for(var i = 0; i < players.length; i++) {
                const playerRef = doc(db, "games", gameId, "players", players[i].id);
                setDoc(playerRef, {isInCurrentGame: true}, {merge: true})
                if (players[i].id == nameInput){
                    alert(players[i].knowsceleb)
                    alert(correctWord)
                    if(players[i].knowsceleb && correctWord == ""){
                        setWriteCeleb(true);
                    }
                }
            }
        }
    }, [players]);
    useEffect(() => {
        if(pressedPlay == true){
            document.getElementById("textInputDiv").style.display = "block";
        }else{
            document.getElementById("textInputDiv").style.display = "none";
        }
    }, [pressedPlay])
    return (
        <div>
            <div className={styles.icon}>
                <Image src="/icon.png" height={100} width={500} alt="icon" />
            </div>
            {game ? (
                <div id = "gameInfo" className={styles.gameInfo}>
                    {(isGamePlayed) ? (
                        <div className={styles.time}>
                            <Image src = {"/clock.png"} alt = {"clock"} height={50} width={50} className={styles.clockImg} />
                            {timeLeft}
                        </div>
                    ) : (<></>)}
                    <div>
                        <ul>
                            {players.map((player) => (
                                <li key={player.id} className={styles.playerInfo}>
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
                                    </div>
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
                    if (event.key === "Enter") {
                        if(writeCeleb){
                            const documentRef = doc(db, "games", gameId);
                            let milliseconds = new Date().valueOf();
                            let seconds = Math.floor( milliseconds / 1000);
                            setDoc(documentRef, { roundStartTime:  seconds})
                            setDoc(documentRef, { word: document.getElementById("textInputBox").value })
                            document.getElementById("textInputBox").value = "";
                            setWriteCeleb(false);
                        }else{
                            const playerRef = doc(db, "games", gameId, "players", nameInput);
                            setDoc(playerRef, { word: document.getElementById("textInputBox").value }, { merge: true })
                            document.getElementById("textInputBox").value = "";
                            setTimeout(() => {
                                const playerRef = doc(db, "games", gameId, "players", nameInput);
                                setDoc(playerRef, { word: "" }, { merge: true })
                            }, 5000)
                        }
                    }
                }}
                className={styles.textInputBox}
                ></input>
                <button onClick = {() =>{
                        const playerRef = doc(db, "games", gameId, "players", nameInput);
                        setDoc(playerRef, { word: document.getElementById("textInputBox").value }, { merge: true })
                        document.getElementById("textInputBox").value = "";
                        setTimeout(() => {
                            const playerRef = doc(db, "games", gameId, "players", nameInput);
                            setDoc(playerRef, { word: "" }, { merge: true })
                        }, 5000)
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
                        height={100}
                        width={100}
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
