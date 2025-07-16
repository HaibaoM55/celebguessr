"use client"
import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect} from 'react';
import {collection, getCountFromServer} from "firebase/firestore";
import {db} from "./firebaseconfig.js"
export default function Home() {
	const [kicked, setKicked] = useState(false);
	const [pressedPlay, setPressedPlay] = useState(false);
	const [pressedPrivate, setPressedPrivate] = useState(false);
	const [pressedAbout, setPressedAbout] = useState(false);
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const kickedParam = urlParams.get("kicked");
		if (kickedParam) {
			setKicked(kickedParam === "true");
		}
	}, []);
	function hostGame(){
		const gameId = Math.random().toString(36).substring(2, 18);
		window.location.href = `/play/${gameId}`;
	}
	function about(){
		setPressedAbout(true);
	}
	function closeAbout(){
		setPressedAbout(false);
	}
	function play(){
		setPressedPlay(true);
	}
	function closePlay(){
		setPressedPlay(false);
	}
	const getPlayerCount = async (server) => {
		const playersRef = collection(db, `games/public${server}/players`);
		const snapshot = await getCountFromServer(playersRef);
		return snapshot.data().count
	};
	async function openPublic(){
		var i = 1;
		while(true){
			var playerCount = await getPlayerCount(i);
			if(playerCount < 10){
				location.href = `/play/public${i}`;
			}
			i++;
		}
	}
	function openPrivate(){
		setPressedPlay(false);
		setPressedPrivate(true);
	}
	function closePrivate(){
		setPressedPrivate(false);
	}
	function enterPrivateRoom(){
		const code = document.getElementById("codeText").value;
		if(code.length === 0){
			alert("Please enter a code");
			return;
		}
		if(!/^[a-zA-Z0-9]+$/.test(code)){
			alert("Invalid code");
			return;
		}
		location.href = `/play/${code}`;
	}
	useEffect(() => {
		if(kicked){
			document.getElementById("kickedDiv").style.opacity = '100%';
		}
	}, [kicked])
	useEffect(() => {
		if(pressedPlay){
			document.getElementById("playDiv").style.opacity = '100%';
		}
	}, [pressedPlay])
	useEffect(() => {
		if(pressedPrivate){
			document.getElementById("privateDiv").style.opacity = '100%';
			document.getElementById("privateDiv").style.height = '125px';
		}
	}, [pressedPrivate]);
	return (
    	<div>
			{(kicked) ? (
				<div className={styles.overlay}>
					<div className={styles.overlayDiv} id = "kickedDiv">
						<p>You were kicked out of your last game</p>
						<br />
						<p>Please try again later</p>
						<button onClick={() => {
							setKicked(false);
						}} className = {styles.OKBtn}>OK</button>
					</div>
				</div>
			): (<></>)}
			{(pressedPlay) ? (
				<div className={styles.overlay}>
					<div className={styles.overlayDiv} id = "playDiv">
						<button className = {styles.closeOverlayBtn} onClick={closePlay}>X</button>
						<div className = {styles.pBtnDiv}>
							<button className = {styles.privateBtn} onClick={openPrivate}>Private</button>
						</div>
						<div className={styles.pBtnDiv}>
							<button className = {styles.publicBtn} onClick = {openPublic}>Public</button>
						</div>
					</div>
				</div>
			): (<></>)}
			{(pressedPrivate) ? (
				<div className={styles.overlay}>
					<div className={styles.overlayDiv} id = "privateDiv">
						<button className = {styles.closeOverlayBtn} onClick={closePrivate}>X</button>
						<div className={styles.pBtnDiv}>
							<input type = "text" 
							className={styles.codeText} 
							id = "codeText" 
							placeholder = "Enter the room's code"
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									enterPrivateRoom();
								}
							}}
							/>
							<button className={styles.enterPrivateBtn} onClick={enterPrivateRoom}>Enter</button>
						</div>
					</div>
				</div>
			): (<></>)}
			{(pressedAbout) ? (
				<div className={styles.overlay}>
					<div className={styles.overlayDiv} id = "aboutDiv">
						<button className = {styles.closeOverlayBtn} onClick={closeAbout}>X</button>
						<p className={styles.aboutText}>
							CelebGuessr is a game where you guess celebrities based on hints given by other players
						</p>
						<p className = {styles.aboutText}>
							Made by <a href = "https://github.com/HaibaoM55/">HaibaoM55</a>
						</p>
					</div>
				</div>
			): (<></>)}
			<div className={styles.icon}>
				<Image src = "/icon.png" height={100} width={500} alt = "icon"/>
			</div>
			<div className={styles.inputDiv}>
				<div className = {styles.playBtnDiv}>
					<button className={styles.playBtn} onClick={play}>Play</button>
				</div>
				<div className = {styles.hostBtnDiv}>
					<button className={styles.hostBtn} onClick={hostGame}>Host a game</button>
				</div>
				<div className = {styles.aboutBtnDiv}>
					<button className = {styles.aboutBtn} onClick={about}>About</button>
				</div>
			</div>
		</div>
	);
}
