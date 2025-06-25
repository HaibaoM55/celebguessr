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

const addPlayer = async (gameId, playerId, profile, numid = 0) => {
    try {
        await setDoc(doc(db, "games", gameId, "players", playerId), {
            knowsceleb: false,
            guessed: false,
            score: 0,
            pfp: profile,
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

    function play() {
        if (players.length < maxPlayers) {
            const exists = players.some((p) => p.id === nameInput);
            if (exists) {
                alert("Somebody else already has that name!");
            }else if(nameInput == ""){
                alert("Please set a name!")
            }
            else {
                const maxNumId = Math.max(
                    ...players.map((p) => p.numid),
                    -1
                );
                addPlayer(gameId, nameInput, userPfpNumber, maxNumId + 1);
                document.getElementById("inputDiv").style.display = "none";
                document.getElementById("gameInfo").style.display = "block";
            }
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

    //Player with smallest numid is host

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
        // Set all other players to not host
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
    return (
        <div>
            <div className={styles.icon}>
                <Image src="/icon.png" height={100} width={500} alt="icon" />
            </div>

            {game ? (
                <div id = "gameInfo" className={styles.gameInfo}>
                    <p>Status: {game.isPublic ? "Public" : "Private"}</p>
                    <div>
                        Players:
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
                                        #{player.numid}
                                        {player.id == nameInput ? " (You)": ""}
                                        {player.isHost ? " (Host)" : ""}:
                                        {player.knowsceleb
                                            ? "knows the celebrity: true"
                                            : "knows the celebrity: false"};
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <p>Loading...</p>
            )}

            <div className={styles.inputDiv} id = "inputDiv">
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
            </div>
        </div>
    );
}
